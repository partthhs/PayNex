"""Products and Categories router"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from app.database import get_db
from app.models import Product, Category
from app.schemas import ProductResponse, ProductListResponse, CategoryResponse
from app.services.channel3 import channel3_service

router = APIRouter(tags=["Products"])


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.sort_order).all()
    return cats


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Category slug"),
    brand: Optional[str] = Query(None, description="Brand name"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    in_stock: Optional[bool] = Query(None),
    sort: str = Query("relevance", description="relevance|price_asc|price_desc|rating|newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
):
    query = db.query(Product).options(joinedload(Product.category))

    # Filters
    if q:
        term = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(Product.name).like(term),
                func.lower(Product.brand).like(term),
                func.lower(Product.short_description).like(term),
                func.lower(Product.description).like(term),
            )
        )
    if category:
        query = query.join(Category).filter(Category.slug == category)
    if brand:
        query = query.filter(func.lower(Product.brand) == brand.lower())
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if min_rating is not None:
        query = query.filter(Product.rating >= min_rating)
    if in_stock is not None:
        query = query.filter(Product.in_stock == in_stock)

    # Sorting
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.reviews_count.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    item_list = list(items)

    # Supplement with Channel3 results if configured and user is searching
    if q and channel3_service.is_configured and page == 1:
        try:
            external_items = await channel3_service.search_products(q, limit=6)
            # Filter external items by budget if specified
            if max_price is not None:
                external_items = [x for x in external_items if x.get("price", 0) <= max_price]
            if min_price is not None:
                external_items = [x for x in external_items if x.get("price", 0) >= min_price]
            
            # Append non-duplicate external items
            item_list.extend(external_items)
            total += len(external_items)
        except Exception:
            pass # Keep PostgreSQL results safe

    return ProductListResponse(
        items=item_list,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 1,
    )


@router.get("/products/{slug}", response_model=ProductResponse)
async def get_product(slug: str, db: Session = Depends(get_db)):
    if slug.startswith("ch3-") or slug.startswith("ch3_"):
        # Retrieve from Channel3
        detail = await channel3_service.get_product_detail(slug)
        if detail:
            return detail
        raise HTTPException(status_code=404, detail="Partner product not found")

    if slug.isdigit():
        product = (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter((Product.slug == slug) | (Product.id == int(slug)))
            .first()
        )
    else:
        product = db.query(Product).options(joinedload(Product.category)).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
