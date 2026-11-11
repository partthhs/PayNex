"""AI Smart Shopping Planner router"""
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass
import json
import re
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Product, Category, ShoppingPlan, ShoppingPlanItem, CartItem
from app.utils.auth import get_current_user
from app.utils.ai import gemini_assistant
import google.generativeai as genai
from app.config import settings
from app.services.channel3 import channel3_service

router = APIRouter(prefix="/planner", tags=["Smart Planner"])


# ─────────────────────────── Schemas ───────────────────────────────────────

class PlanGenerateRequest(BaseModel):
    budget: float
    requirements: str
    categories: list[str] = []
    preferred_brands: list[str] = []
    additional_requirements: str = ""


class PlanItemOut(BaseModel):
    id: Optional[int] = None
    product_id: Union[int, str]
    slug: str
    name: str
    brand: str
    price: float
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    rating: float = 4.5
    badge: Optional[str] = None
    short_description: Optional[str] = None
    category: str
    in_stock: bool = True
    ai_explanation: str
    specs: Optional[dict] = {}
    features: Optional[list[str]] = []
    is_external: Optional[bool] = False
    merchant_name: Optional[str] = None
    external_url: Optional[str] = None

    class Config:
        from_attributes = True


class ShoppingPlanOut(BaseModel):
    id: Optional[int] = None
    name: str = "My Shopping Plan"
    budget: float
    total_cost: float
    remaining_budget: float
    budget_utilization: float
    requirements: str
    items: list[PlanItemOut]
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class SavePlanRequest(BaseModel):
    name: str
    budget: float
    total_cost: float
    requirements: str
    categories: list[str] = []
    items: list[dict]  # [{product_id, ai_explanation, price_at_addition}]


class ReplaceItemRequest(BaseModel):
    plan_id: Optional[int] = None
    item_id: Optional[int] = None
    exclude_slugs: list[str]
    category: str
    max_price: float
    requirements: str = ""


class AlternativeProductOut(BaseModel):
    product: PlanItemOut
    price_difference: float
    recommendation_reason: str
    tier: str  # 'budget_saver', 'premium_upgrade', 'balanced'


class AlternativesResponse(BaseModel):
    category: str
    current_product_slug: str
    budget_ceiling: float
    alternatives: list[AlternativeProductOut]


class ComparisonRequest(BaseModel):
    slugs: list[str]
    user_requirements: Optional[str] = ""


class ComparisonResponse(BaseModel):
    products: list[PlanItemOut]
    ai_verdict: str
    best_value_slug: Optional[str] = None
    best_performance_slug: Optional[str] = None


# ─────────────────────────── Helpers ───────────────────────────────────────

def extract_categories_from_text(text: str) -> list[str]:
    t = text.lower()
    cats = []
    if re.search(r'\b(laptop|laptops|notebook|notebooks|macbook|pc|computer)\b', t):
        cats.append('laptops')
    if re.search(r'\b(phone|phones|smartphone|smartphones|mobile|mobiles|iphone|android)\b', t):
        cats.append('smartphones')
    if re.search(r'\b(headphone|headphones|earphone|earphones|earbuds|airpods|headset|audio)\b', t):
        cats.append('headphones')
    if re.search(r'\b(tablet|tablets|ipad)\b', t):
        cats.append('tablets')
    if re.search(r'\b(camera|cameras|dslr|lens)\b', t):
        cats.append('cameras')
    if re.search(r'\b(watch|watches|smartwatch|smartwatches)\b', t):
        cats.append('smartwatches')
    if re.search(r'\b(speaker|speakers)\b', t):
        cats.append('speakers')
    if re.search(r'\b(mouse|keyboard|charger|accessory|accessories|adapter|cable|case)\b', t):
        cats.append('accessories')
    return cats


def _build_planner_catalog(db: Session, categories: list[str] = None, max_price: float = None) -> str:
    """Build catalog JSON filtered by categories/price for planner context."""
    query = db.query(Product).options(joinedload(Product.category)).filter(Product.in_stock == True)
    if categories:
        query = query.join(Product.category).filter(Category.slug.in_(categories))
    if max_price:
        query = query.filter(Product.price <= max_price)
    products = query.all()
    catalog = []
    for p in products:
        catalog.append({
            "slug": p.slug,
            "name": p.name,
            "brand": p.brand,
            "category": p.category.slug if p.category else "",
            "price": p.price,
            "original_price": p.original_price,
            "rating": p.rating,
            "in_stock": p.in_stock,
            "short_description": p.short_description,
            "features": p.features or [],
        })
    return json.dumps(catalog, ensure_ascii=False)


def _product_to_item_out(p: Product, explanation: str, item_id: int = None) -> PlanItemOut:
    return PlanItemOut(
        id=item_id,
        product_id=p.id,
        slug=p.slug,
        name=p.name,
        brand=p.brand,
        price=p.price,
        original_price=p.original_price,
        image_url=p.image_url,
        rating=p.rating,
        badge=p.badge,
        short_description=p.short_description,
        category=p.category.slug if p.category else "",
        in_stock=p.in_stock,
        ai_explanation=explanation,
        specs=p.specs or {},
        features=p.features or [],
    )


async def _call_gemini_for_plan(
    budget: float,
    requirements: str,
    categories: list[str],
    preferred_brands: list[str],
    additional_requirements: str,
    catalog_json: str,
) -> list[dict]:
    """Call Gemini and return list of {slug, explanation} dicts within budget."""
    try:
        import truststore
        truststore.inject_into_ssl()
    except Exception:
        pass
    genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    cat_filter = f"Filter to categories: {', '.join(categories)}." if categories else ""
    brand_pref = f"Prefer brands: {', '.join(preferred_brands)}." if preferred_brands else ""
    extra = f"Additional requirements: {additional_requirements}" if additional_requirements else ""

    prompt = f"""You are PayNex AI Smart Shopping Planner. Help the user select the BEST combination of products within their budget.

STRICT RULES:
1. Total cost of ALL selected products MUST NOT exceed ₹{budget:,.0f}
2. Only recommend products that exist in the catalog below (use exact slugs)
3. Only recommend IN-STOCK products (in_stock: true)
4. Each product must be from a DIFFERENT category to avoid duplicates
5. Maximize value within the budget
6. {cat_filter}
7. {brand_pref}
8. {extra}

USER BUDGET: ₹{budget:,.0f}
USER REQUIREMENTS: {requirements}

PRODUCT CATALOG (all in-stock products within budget):
{catalog_json}

INSTRUCTIONS:
- Analyze the requirements and select the best combination of products
- Each product must serve a distinct purpose
- Do NOT invent products or slugs - use ONLY slugs from the catalog above
- Keep total cost strictly under ₹{budget:,.0f}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation outside JSON):
PLAN_JSON: [{{"slug": "exact-product-slug", "explanation": "Why this product fits the requirement"}}]

If no suitable combination exists within budget, return: PLAN_JSON: []"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Extract PLAN_JSON or JSON array
        match = re.search(r'PLAN_JSON:\s*(\[.*?\])', text, re.DOTALL)
        if not match:
            match = re.search(r'(\[\s*\{.*?\}\s*\])', text, re.DOTALL)
        if match:
            content = match.group(1)
            plan_data = json.loads(content)
            return [item for item in plan_data if isinstance(item, dict) and "slug" in item]
    except Exception as e:
        print(f"Gemini planner error: {e}")
    return []


# ─────────────────────────── Endpoints ─────────────────────────────────────

@router.post("/generate", response_model=ShoppingPlanOut)
async def generate_plan(
    payload: PlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI shopping plan within budget. Does NOT save to DB."""
    if payload.budget <= 0:
        raise HTTPException(status_code=400, detail="Budget must be positive")
    if not payload.requirements.strip():
        raise HTTPException(status_code=400, detail="Requirements cannot be empty")

    # If no categories were explicitly selected, auto-detect from natural language requirements
    effective_categories = payload.categories or []
    if not effective_categories:
        effective_categories = extract_categories_from_text(payload.requirements)

    # Build filtered catalog (only in-stock products within budget)
    catalog_json = _build_planner_catalog(db, effective_categories or None, payload.budget)

    # Call Gemini
    plan_items_raw = await _call_gemini_for_plan(
        budget=payload.budget,
        requirements=payload.requirements,
        categories=effective_categories,
        preferred_brands=payload.preferred_brands,
        additional_requirements=payload.additional_requirements,
        catalog_json=catalog_json,
    )

    # Resolve products from DB, enforce budget strictly
    items_out = []
    total_cost = 0.0
    seen_categories = set()
    seen_slugs = set()

    for item_data in plan_items_raw:
        slug = item_data.get("slug", "")
        explanation = item_data.get("explanation", "Selected by AI based on your requirements")

        if slug in seen_slugs:
            continue

        product = db.query(Product).options(joinedload(Product.category)).filter(
            Product.slug == slug
        ).first()

        if not product or not product.in_stock:
            continue

        # Enforce budget ceiling
        if total_cost + product.price > payload.budget:
            continue

        seen_slugs.add(slug)
        seen_categories.add(product.category.slug if product.category else "")
        total_cost += product.price
        items_out.append(_product_to_item_out(product, explanation))

    # Fallback: if Gemini returned nothing, do a smart DB query
    if not items_out:
        # Try to pick one good product from each detected category within budget
        cats_to_try = effective_categories if effective_categories else ['laptops', 'headphones', 'accessories']
        remaining_budget = payload.budget
        for cat_slug in cats_to_try:
            if remaining_budget <= 0:
                break
            product = (
                db.query(Product)
                .options(joinedload(Product.category))
                .join(Product.category)
                .filter(Category.slug == cat_slug)
                .filter(Product.in_stock == True)
                .filter(Product.price <= remaining_budget)
                .order_by(Product.rating.desc())
                .first()
            )
            if product and product.slug not in seen_slugs:
                seen_slugs.add(product.slug)
                total_cost += product.price
                remaining_budget -= product.price
                items_out.append(_product_to_item_out(
                    product,
                    f"Top-rated {cat_slug} within your budget"
                ))

    remaining = payload.budget - total_cost
    utilization = (total_cost / payload.budget * 100) if payload.budget > 0 else 0

    return ShoppingPlanOut(
        id=None,
        name="My Shopping Plan",
        budget=payload.budget,
        total_cost=round(total_cost, 2),
        remaining_budget=round(remaining, 2),
        budget_utilization=round(utilization, 1),
        requirements=payload.requirements,
        items=items_out,
        created_at=None,
    )


@router.post("/save", response_model=ShoppingPlanOut)
async def save_plan(
    payload: SavePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a generated plan to the database."""
    plan = ShoppingPlan(
        user_id=current_user.id,
        name=payload.name or "My Shopping Plan",
        budget=payload.budget,
        total_cost=payload.total_cost,
        requirements=payload.requirements,
        categories=payload.categories,
    )
    db.add(plan)
    db.flush()

    items_out = []
    for item_data in payload.items:
        product_id = item_data.get("product_id")
        product = db.query(Product).options(joinedload(Product.category)).filter(
            Product.id == product_id
        ).first()
        if not product:
            continue
        db_item = ShoppingPlanItem(
            plan_id=plan.id,
            product_id=product.id,
            ai_explanation=item_data.get("ai_explanation", ""),
            price_at_addition=item_data.get("price_at_addition", product.price),
        )
        db.add(db_item)
        db.flush()
        items_out.append(_product_to_item_out(product, db_item.ai_explanation, db_item.id))

    db.commit()
    db.refresh(plan)

    total_cost = sum(i.price for i in items_out)
    remaining = plan.budget - total_cost
    utilization = (total_cost / plan.budget * 100) if plan.budget > 0 else 0

    return ShoppingPlanOut(
        id=plan.id,
        name=plan.name,
        budget=plan.budget,
        total_cost=round(total_cost, 2),
        remaining_budget=round(remaining, 2),
        budget_utilization=round(utilization, 1),
        requirements=plan.requirements,
        items=items_out,
        created_at=plan.created_at.isoformat() if plan.created_at else None,
    )


@router.get("/plans")
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user's saved plans."""
    plans = (
        db.query(ShoppingPlan)
        .filter(ShoppingPlan.user_id == current_user.id)
        .options(joinedload(ShoppingPlan.items))
        .order_by(ShoppingPlan.created_at.desc())
        .all()
    )
    result = []
    for plan in plans:
        result.append({
            "id": plan.id,
            "name": plan.name,
            "budget": plan.budget,
            "total_cost": plan.total_cost,
            "requirements": plan.requirements,
            "item_count": len(plan.items),
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
        })
    return result


@router.get("/plans/{plan_id}", response_model=ShoppingPlanOut)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific saved plan with all items."""
    plan = (
        db.query(ShoppingPlan)
        .options(joinedload(ShoppingPlan.items).joinedload(ShoppingPlanItem.product).joinedload(Product.category))
        .filter(ShoppingPlan.id == plan_id, ShoppingPlan.user_id == current_user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    items_out = []
    total_cost = 0.0
    for db_item in plan.items:
        p = db_item.product
        if not p:
            continue
        items_out.append(_product_to_item_out(p, db_item.ai_explanation, db_item.id))
        total_cost += p.price

    remaining = plan.budget - total_cost
    utilization = (total_cost / plan.budget * 100) if plan.budget > 0 else 0

    return ShoppingPlanOut(
        id=plan.id,
        name=plan.name,
        budget=plan.budget,
        total_cost=round(total_cost, 2),
        remaining_budget=round(remaining, 2),
        budget_utilization=round(utilization, 1),
        requirements=plan.requirements,
        items=items_out,
        created_at=plan.created_at.isoformat() if plan.created_at else None,
    )


@router.delete("/plans/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a saved plan."""
    plan = db.query(ShoppingPlan).filter(
        ShoppingPlan.id == plan_id, ShoppingPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted"}


@router.get("/alternatives", response_model=AlternativesResponse)
def get_alternatives(
    category: str,
    current_slug: str,
    max_price: float,
    current_price: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve ranked alternative recommendations in the same category within budget."""
    candidates = (
        db.query(Product)
        .options(joinedload(Product.category))
        .join(Product.category)
        .filter(Category.slug == category)
        .filter(Product.in_stock == True)
        .filter(Product.price <= max_price)
        .filter(Product.slug != current_slug)
        .order_by(Product.rating.desc())
        .limit(6)
        .all()
    )

    alternatives = []
    for cand in candidates:
        diff = round(cand.price - current_price, 2)
        if diff < -1000:
            tier = "budget_saver"
            reason = f"Saves ₹{abs(diff):,.0f} compared to current choice while offering a solid {cand.rating}★ rating."
        elif diff > 1000:
            tier = "premium_upgrade"
            reason = f"Upgrade for ₹{abs(diff):,.0f} extra with enhanced features and specs."
        else:
            tier = "balanced"
            reason = f"Similar price point (diff: ₹{abs(diff):,.0f}) with alternative brand & styling."

        item_out = _product_to_item_out(cand, cand.short_description or cand.name)
        alternatives.append(AlternativeProductOut(
            product=item_out,
            price_difference=diff,
            recommendation_reason=reason,
            tier=tier,
        ))

    return AlternativesResponse(
        category=category,
        current_product_slug=current_slug,
        budget_ceiling=max_price,
        alternatives=alternatives,
    )


@router.post("/compare-products", response_model=ComparisonResponse)
async def compare_planner_products(
    payload: ComparisonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Perform side-by-side spec comparison with AI verdict."""
    if not payload.slugs:
        raise HTTPException(status_code=400, detail="Must provide at least 1 product slug to compare")

    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.slug.in_(payload.slugs))
        .all()
    )

    items_out = [_product_to_item_out(p, p.short_description or "") for p in products]

    if not items_out:
        raise HTTPException(status_code=404, detail="No products found matching slugs")

    # Determine best value (highest rating per thousand rupees)
    best_val = min(items_out, key=lambda x: x.price)
    best_perf = max(items_out, key=lambda x: (x.rating, -x.price))

    verdict = f"Comparing {len(items_out)} items. The {best_val.name} is the most economical choice at ₹{best_val.price:,.0f}, while {best_perf.name} offers top evaluation specs."

    # Try Gemini for richer comparative verdict if configured
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        prompt = f"""Compare these {len(items_out)} products for shopping evaluation:
{json.dumps([{'name': i.name, 'brand': i.brand, 'price': i.price, 'specs': i.specs, 'features': i.features} for i in items_out], ensure_ascii=False)}

User requirements: {payload.user_requirements or 'General shopping guidance'}

Provide a 2-3 sentence concise comparative recommendation stating which product is best for budget and which is best for performance."""
        res = model.generate_content(prompt)
        if res and res.text:
            verdict = res.text.strip()
    except Exception:
        pass

    return ComparisonResponse(
        products=items_out,
        ai_verdict=verdict,
        best_value_slug=best_val.slug,
        best_performance_slug=best_perf.slug,
    )


@router.post("/replace-item", response_model=PlanItemOut)
async def replace_item(
    payload: ReplaceItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get an alternative product for one slot in the plan."""
    # Find best-rated in-stock product matching the category & price, excluding current
    query = (
        db.query(Product)
        .options(joinedload(Product.category))
        .join(Product.category)
        .filter(Category.slug == payload.category)
        .filter(Product.in_stock == True)
        .filter(Product.price <= payload.max_price)
        .filter(~Product.slug.in_(payload.exclude_slugs))
        .order_by(Product.rating.desc())
    )
    replacement = query.first()
    if not replacement:
        raise HTTPException(
            status_code=404,
            detail=f"No alternative {payload.category} found under ₹{payload.max_price:,.0f}"
        )
    return _product_to_item_out(replacement, f"Alternative {payload.category} within your budget")


@router.post("/add-all-to-cart")
def add_all_to_cart(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add all items from a saved plan to cart."""
    plan = (
        db.query(ShoppingPlan)
        .options(joinedload(ShoppingPlan.items).joinedload(ShoppingPlanItem.product))
        .filter(ShoppingPlan.id == plan_id, ShoppingPlan.user_id == current_user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    added = 0
    errors = []
    for plan_item in plan.items:
        product = plan_item.product
        if not product or not product.in_stock:
            errors.append(f"{product.name if product else 'Unknown'} is out of stock")
            continue
        existing = db.query(CartItem).filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == product.id,
        ).first()
        if existing:
            existing.quantity += 1
        else:
            db.add(CartItem(user_id=current_user.id, product_id=product.id, quantity=1))
        added += 1

    db.commit()
    return {"added": added, "errors": errors, "message": f"Added {added} items to cart"}
