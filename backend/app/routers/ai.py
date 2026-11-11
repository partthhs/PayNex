"""AI Assistant router"""
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from app.database import get_db
from app.models import User, AIConversation, AIMessage, MessageRole, Product, Category
from app.schemas import ChatRequest, ChatResponse, ChatProductRef
from app.utils.auth import get_optional_current_user, get_current_user
from app.utils.ai import gemini_assistant, extract_budget, extract_category
from app.services.channel3 import channel3_service
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
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Send a message to the AI shopping assistant (supports both authenticated and guest users)."""
    effective_budget = payload.budget or extract_budget(payload.message)
    detected_category = extract_category(payload.message)

    # 1. Conversation tracking (persisted if user is logged in)
    conv = None
    history = []
    if current_user:
        if payload.conversation_id:
            conv = db.query(AIConversation).filter(
                AIConversation.id == payload.conversation_id,
                AIConversation.user_id == current_user.id,
            ).first()
        if not conv:
            conv = AIConversation(user_id=current_user.id, title=payload.message[:60])
            db.add(conv)
            db.flush()

        history = [
            {"role": msg.role.value, "content": msg.content}
            for msg in conv.messages
        ]
    elif payload.history:
        history = payload.history

    # Inherit conversation context (category & budget) for follow-up turns
    if not detected_category and history:
        for prev in reversed(history):
            c = extract_category(prev.get("content", ""))
            if c:
                detected_category = c
                break

    if effective_budget is None and history:
        for prev in reversed(history):
            b = extract_budget(prev.get("content", ""))
            if b:
                effective_budget = b
                break

    # 2. Build catalog context
    catalog_json = _build_catalog_json(db)

    # 3. Call Gemini assistant
    result = await gemini_assistant.chat(
        user_message=payload.message,
        history=history,
        catalog_json=catalog_json,
        budget=effective_budget,
    )

    # 4. Resolve and STRICTLY filter recommended products
    candidate_slugs = result.get("product_slugs") or []
    matched_products = []

    for slug in candidate_slugs[:6]:
        product = db.query(Product).options(
            joinedload(Product.category)
        ).filter(Product.slug == slug).first()
        if not product:
            continue
        # Strict Budget Ceiling Enforcement
        if effective_budget is not None and product.price > effective_budget:
            continue
        # Strict Category Enforcement
        if detected_category and product.category.slug != detected_category:
            continue
        matched_products.append(product)

    # 5. Database fallback if Gemini returned no valid slugs within constraints
    if not matched_products and (detected_category or effective_budget):
        query = db.query(Product).options(joinedload(Product.category))
        if detected_category:
            query = query.join(Product.category).filter(Category.slug == detected_category)
        if effective_budget is not None:
            query = query.filter(Product.price <= effective_budget)
        matched_products = query.order_by(Product.rating.desc()).limit(3).all()

    # 5b. Supplement with Channel3 verified partner products if configured
    external_refs = []
    if channel3_service.is_configured:
        try:
            ch3_results = await channel3_service.search_products(payload.message, limit=3)
            for item in ch3_results:
                if effective_budget is not None and item.get("price", 0) > effective_budget:
                    continue
                external_refs.append(
                    ChatProductRef(
                        id=item["id"],
                        slug=item["slug"],
                        name=item["name"],
                        brand=item["brand"],
                        price=item["price"],
                        original_price=item["original_price"],
                        image_url=item["image_url"],
                        rating=4.5,
                        reviews_count=20,
                        badge=item.get("badge", "Verified Partner"),
                        short_description=item.get("short_description", ""),
                        in_stock=True,
                        features=[],
                        category="External Partner",
                        is_external=True,
                        merchant_name=item.get("merchant_name"),
                        external_url=item.get("external_url")
                    )
                )
        except Exception:
            pass

    # 6. Ensure the text accurately explains if no items exist within budget
    response_text = result["text"]
    if not matched_products and effective_budget is not None:
        cat_filter = detected_category or "products"
        lowest_in_cat = None
        if detected_category:
            lowest_in_cat = (
                db.query(Product)
                .join(Product.category)
                .filter(Category.slug == detected_category)
                .order_by(Product.price.asc())
                .first()
            )
        if lowest_in_cat:
            response_text = (
                f"No {detected_category} in our catalog are currently available under ₹{effective_budget:,.0f}. "
                f"The entry-level option in this category is the {lowest_in_cat.name} starting at ₹{lowest_in_cat.price:,.0f}."
            )
        else:
            response_text = f"No {cat_filter} are currently available in the catalog under ₹{effective_budget:,.0f}."

    # 7. Persist messages if user is authenticated
    if current_user and conv:
        user_msg = AIMessage(
            conversation_id=conv.id,
            role=MessageRole.USER,
            content=payload.message,
        )
        ai_msg = AIMessage(
            conversation_id=conv.id,
            role=MessageRole.ASSISTANT,
            content=response_text,
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
            reviews_count=p.reviews_count,
            badge=p.badge,
            short_description=p.short_description,
            in_stock=p.in_stock,
            features=p.features or [],
            category=p.category.slug if p.category else None,
            is_external=False,
        )
        for p in matched_products
    ] + external_refs

    return ChatResponse(
        conversation_id=conv.id if conv else None,
        message=response_text,
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
