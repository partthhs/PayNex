"""Wishlist router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, WishlistItem, Product
from app.schemas import WishlistItemResponse
from app.utils.auth import get_current_user
from app.services.activity import log_activity

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("", response_model=list[WishlistItemResponse])
def get_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(WishlistItem)
        .options(joinedload(WishlistItem.product).joinedload(Product.category))
        .filter(WishlistItem.user_id == current_user.id)
        .all()
    )
    return items


@router.post("/{product_id}", response_model=WishlistItemResponse)
def add_to_wishlist(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if product_id.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id)).first()
    else:
        product = db.query(Product).filter(Product.slug == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == product.id,
    ).first()
    if existing:
        return db.query(WishlistItem).options(
            joinedload(WishlistItem.product).joinedload(Product.category)
        ).filter(WishlistItem.id == existing.id).first()

    item = WishlistItem(user_id=current_user.id, product_id=product.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    log_activity(db, current_user.id, "wishlist", f"Saved {product.name} to wishlist")

    return db.query(WishlistItem).options(
        joinedload(WishlistItem.product).joinedload(Product.category)
    ).filter(WishlistItem.id == item.id).first()


@router.delete("/{product_id}")
def remove_from_wishlist(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if product_id.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id)).first()
    else:
        product = db.query(Product).filter(Product.slug == product_id).first()

    target_id = product.id if product else (int(product_id) if product_id.isdigit() else None)
    if not target_id:
        raise HTTPException(status_code=404, detail="Product not found")

    item = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == target_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not in wishlist")
    db.delete(item)
    db.commit()
    return {"message": "Removed from wishlist"}
