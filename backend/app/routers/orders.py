"""Orders router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, Order, OrderItem, CartItem, Product, Payment, PaymentStatus, OrderStatus
from app.schemas import CreateOrderRequest, OrderResponse
from app.utils.auth import get_current_user
from app.services.activity import log_activity

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Load user's cart
    cart_items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 2. Verify all products are in stock and calculate totals server-side
    subtotal = 0.0
    for cart_item in cart_items:
        if not cart_item.product.in_stock or (cart_item.product.stock_quantity is not None and cart_item.product.stock_quantity < cart_item.quantity):
            raise HTTPException(
                status_code=400,
                detail=f"{cart_item.product.name} is out of stock or has insufficient quantity",
            )
        subtotal += cart_item.product.price * cart_item.quantity

    shipping_cost = 0.0 if subtotal >= 50000 else 299.0
    total = subtotal + shipping_cost

    s = payload.shipping

    # 3. Create the Order record
    order = Order(
        user_id=current_user.id,
        status=OrderStatus.PENDING,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=total,
        shipping_name=s.name,
        shipping_email=s.email,
        shipping_phone=s.phone,
        shipping_address1=s.address1,
        shipping_address2=s.address2,
        shipping_city=s.city,
        shipping_state=s.state,
        shipping_pincode=s.pincode,
    )
    db.add(order)
    db.flush()

    # 4. Create OrderItem records (snapshot prices)
    for cart_item in cart_items:
        p = cart_item.product
        oi = OrderItem(
            order_id=order.id,
            product_id=p.id,
            product_name=p.name,
            product_image=p.image_url,
            unit_price=p.price,
            quantity=cart_item.quantity,
            subtotal=p.price * cart_item.quantity,
        )
        db.add(oi)

    # 5. Create a pending Payment record
    payment = Payment(
        order_id=order.id,
        status=PaymentStatus.PENDING,
        amount=total,
        currency="USD",
    )
    db.add(payment)

    db.commit()
    db.refresh(order)

    log_activity(db, current_user.id, "order", f"Created order #{order.id} for ₹{total:,.0f}")

    return _load_order(db, order.id)


@router.get("", response_model=list[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_load_order(db, o.id) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _load_order(db, order_id)


def _load_order(db: Session, order_id: int) -> Order:
    return (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.payment),
        )
        .filter(Order.id == order_id)
        .first()
    )
