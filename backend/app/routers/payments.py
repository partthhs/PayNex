"""PayPal payment router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Order, Payment, PaymentStatus, OrderStatus, CartItem
from app.schemas import CreatePaypalOrderRequest, CreatePaypalOrderResponse, CapturePaymentRequest
from app.utils.auth import get_current_user
from app.utils.paypal import create_paypal_order, capture_paypal_order, get_paypal_order
from app.services.activity import log_activity
from app.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

FRONTEND_URL = settings.FRONTEND_URL


@router.post("/create", response_model=CreatePaypalOrderResponse)
async def create_payment(
    payload: CreatePaypalOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Step 1: Create a PayPal order for a confirmed order.
    Returns the PayPal order ID and approval URL.
    """
    # Verify order belongs to user and is pending
    order = db.query(Order).filter(
        Order.id == payload.order_id,
        Order.user_id == current_user.id,
        Order.status == OrderStatus.PENDING,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or already processed")

    # Verify payment record exists and hasn't been captured
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    if not payment:
        raise HTTPException(status_code=400, detail="Payment record not found")
    if payment.status == PaymentStatus.CAPTURED:
        raise HTTPException(status_code=409, detail="Payment already captured — duplicate prevention triggered")

    if not settings.PAYPAL_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to backend .env"
        )

    try:
        result = await create_paypal_order(
            amount_inr=order.total,
            order_ref=str(order.id),
            return_url=f"{FRONTEND_URL}/orders?paypal_success=1&order_id={order.id}",
            cancel_url=f"{FRONTEND_URL}/checkout?paypal_cancelled=1",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PayPal API error: {str(e)}")

    # Update payment record with PayPal order ID
    payment.paypal_order_id = result["paypal_order_id"]
    payment.status = PaymentStatus.CREATED
    payment.paypal_response = result["raw"]
    db.commit()

    return CreatePaypalOrderResponse(
        paypal_order_id=result["paypal_order_id"],
        approve_url=result["approve_url"],
    )


@router.post("/capture")
async def capture_payment(
    payload: CapturePaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Step 2: Capture an approved PayPal payment.
    NEVER trust the frontend — always verify with PayPal server-side.
    """
    # Find the payment by PayPal order ID
    payment = db.query(Payment).filter(
        Payment.paypal_order_id == payload.paypal_order_id,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Verify order belongs to current user
    order = db.query(Order).filter(
        Order.id == payment.order_id,
        Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Duplicate capture protection
    if payment.status == PaymentStatus.CAPTURED:
        return {"message": "Payment already captured", "status": "CAPTURED", "order_id": order.id}

    if payment.status not in (PaymentStatus.CREATED, PaymentStatus.APPROVED):
        raise HTTPException(status_code=400, detail=f"Cannot capture payment in status: {payment.status}")

    try:
        capture_data = await capture_paypal_order(payload.paypal_order_id)
    except Exception as e:
        payment.status = PaymentStatus.FAILED
        db.commit()
        raise HTTPException(status_code=502, detail=f"PayPal capture failed: {str(e)}")

    # Verify capture was successful
    capture_status = capture_data.get("status")
    if capture_status != "COMPLETED":
        payment.status = PaymentStatus.FAILED
        payment.paypal_response = capture_data
        db.commit()
        raise HTTPException(status_code=400, detail=f"Payment not completed. Status: {capture_status}")

    # Extract capture ID
    captures = (
        capture_data.get("purchase_units", [{}])[0]
        .get("payments", {})
        .get("captures", [{}])
    )
    capture_id = captures[0].get("id") if captures else None

    # Update payment and order
    payment.status = PaymentStatus.CAPTURED
    payment.paypal_capture_id = capture_id
    payment.paypal_response = capture_data
    order.status = OrderStatus.CONFIRMED

    # Clear the user's cart
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()

    db.commit()
    log_activity(db, current_user.id, "order", f"Payment captured for order #{order.id}")

    return {
        "message": "Payment successful",
        "status": "CAPTURED",
        "order_id": order.id,
        "capture_id": capture_id,
    }
