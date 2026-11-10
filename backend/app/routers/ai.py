"""AI Assistant router"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, AIConversation, AIMessage, MessageRole, Product, Category
from app.schemas import ChatRequest, ChatResponse, ChatProductRef
from app.utils.auth import get_current_user
from app.utils.ai import gemini_assistant
from app.services.activity import log_activity

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


def _build_catalog_json(db: Session) -> str:
    """Build a compact JSON catalog for the AI context."""
    products = db.query(Product).options(joinedload(Product.category)).all()
    catalog = []
    for p in products:
        catalog.append({
            "slug": p.slug,
            "name": p.name,
            "brand": p.brand,
            "category": p.category.slug,
            "price": p.price,
            "original_price": p.original_price,
            "rating": p.rating,
            "in_stock": p.in_stock,
            "short_description": p.short_description,
            "features": p.features or [],
            "specs": p.specs or {},
        })
    return json.dumps(catalog, ensure_ascii=False)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI shopping assistant."""
    # Get or create conversation
    if payload.conversation_id:
        conv = db.query(AIConversation).filter(
            AIConversation.id == payload.conversation_id,
            AIConversation.user_id == current_user.id,
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = AIConversation(user_id=current_user.id, title=payload.message[:60])
        db.add(conv)
        db.flush()

    # Build history from stored messages
    history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in conv.messages
    ]

    # Build catalog context
    catalog_json = _build_catalog_json(db)

    # Call Gemini (or fallback)
    result = await gemini_assistant.chat(
        user_message=payload.message,
        history=history,
        catalog_json=catalog_json,
        budget=payload.budget,
    )

    # Resolve product slugs to Product DB records
    matched_products = []
    if result.get("product_slugs"):
        for slug in result["product_slugs"][:6]:  # max 6 recommendations
            product = db.query(Product).options(
                joinedload(Product.category)
            ).filter(Product.slug == slug).first()
            if product:
                matched_products.append(product)

    # Fallback: keyword search if Gemini returned no slugs
    if not matched_products:
        from sqlalchemy import or_, func
        q = payload.message.lower()
        query = db.query(Product).options(joinedload(Product.category))
        if payload.budget:
            query = query.filter(Product.price <= payload.budget)
        products = query.filter(
            or_(
                func.lower(Product.name).like(f"%{q}%"),
                func.lower(Product.brand).like(f"%{q}%"),
                func.lower(Product.short_description).like(f"%{q}%"),
            )
        ).limit(3).all()
        matched_products = products

    # Store messages in DB
    user_msg = AIMessage(
        conversation_id=conv.id,
        role=MessageRole.USER,
        content=payload.message,
    )
    ai_msg = AIMessage(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content=result["text"],
        product_ids=[p.id for p in matched_products],
    )
    db.add(user_msg)
    db.add(ai_msg)
    db.commit()

    log_activity(db, current_user.id, "search", f"AI: {payload.message[:80]}")

    product_refs = [
        ChatProductRef(
            id=p.id,
            slug=p.slug,
            name=p.name,
            brand=p.brand,
            price=p.price,
            original_price=p.original_price,
            image_url=p.image_url,
            rating=p.rating,
            badge=p.badge,
        )
        for p in matched_products
    ]

    return ChatResponse(
        conversation_id=conv.id,
        message=result["text"],
        products=product_refs,
        note=result.get("note"),
    )


@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convs = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.created_at.desc())
        .limit(20)
        .all()
    )
    return [{"id": c.id, "title": c.title, "created_at": c.created_at} for c in convs]
