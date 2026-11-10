"""Products and Categories router"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from app.database import get_db
from app.models import Product, Category
from app.schemas import ProductResponse, ProductListResponse, CategoryResponse

router = APIRouter(tags=["Products"])


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.sort_order).all()
    return cats


@router.get("/products", response_model=ProductListResponse)
def list_products(
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
    page_size: int = Query(12, ge=1, le=50),
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

    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/products/{slug}", response_model=ProductResponse)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
