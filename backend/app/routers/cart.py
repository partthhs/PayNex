"""Cart router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, CartItem, Product
from app.schemas import CartResponse, CartItemResponse, AddToCartRequest, UpdateCartRequest, ProductResponse
from app.utils.auth import get_current_user
from app.services.activity import log_activity

router = APIRouter(prefix="/cart", tags=["Cart"])

SHIPPING_THRESHOLD = 50000  # Free shipping above this amount
SHIPPING_COST = 299


def _build_cart_response(items: list[CartItem]) -> CartResponse:
    cart_items = []
    subtotal = 0.0
    for item in items:
        item_total = item.product.price * item.quantity
        subtotal += item_total
        cart_items.append(CartItemResponse(
            id=item.id,
            product=item.product,
            quantity=item.quantity,
            added_at=item.added_at,
            item_total=item_total,
        ))
    shipping_cost = 0.0 if subtotal >= SHIPPING_THRESHOLD or subtotal == 0 else SHIPPING_COST
    return CartResponse(
        items=cart_items,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=subtotal + shipping_cost,
        item_count=sum(i.quantity for i in items),
    )


@router.get("", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    return _build_cart_response(items)


@router.post("", response_model=CartResponse)
def add_to_cart(
    payload: AddToCartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if isinstance(payload.product_id, int) or (isinstance(payload.product_id, str) and payload.product_id.isdigit()):
        product = db.query(Product).filter(Product.id == int(payload.product_id), Product.in_stock == True).first()
    else:
        product = db.query(Product).filter(Product.slug == str(payload.product_id), Product.in_stock == True).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found or out of stock")

    existing = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == product.id,
    ).first()

    if existing:
        existing.quantity = min(existing.quantity + payload.quantity, 10)
    else:
        item = CartItem(user_id=current_user.id, product_id=product.id, quantity=payload.quantity)
        db.add(item)

    db.commit()
    log_activity(db, current_user.id, "cart", f"Added {product.name} to cart")

    return get_cart(db=db, current_user=current_user)


@router.put("/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    payload: UpdateCartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    item.quantity = payload.quantity
    db.commit()
    return get_cart(db=db, current_user=current_user)


@router.delete("/{item_id}", response_model=CartResponse)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    return get_cart(db=db, current_user=current_user)


@router.delete("", response_model=CartResponse)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return CartResponse(items=[], subtotal=0, shipping_cost=0, total=0, item_count=0)
