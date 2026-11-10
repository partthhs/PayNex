"""Price Alerts router"""
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Product, PriceAlert
from app.utils.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Price Alerts"])


# ─────────────────────────── Schemas ───────────────────────────────────────

class CreateAlertRequest(BaseModel):
    product_id: Union[int, str]
    target_price: float


class UpdateAlertRequest(BaseModel):
    target_price: float


def _alert_to_dict(alert: PriceAlert, product: Product) -> dict:
    current_price = product.price
    price_diff = current_price - alert.target_price
    pct_diff = (price_diff / current_price * 100) if current_price > 0 else 0
    return {
        "id": alert.id,
        "product_id": alert.product_id,
        "slug": product.slug,
        "name": product.name,
        "brand": product.brand,
        "image_url": product.image_url,
        "current_price": current_price,
        "target_price": alert.target_price,
        "initial_price": alert.initial_price,
        "price_diff": round(price_diff, 2),
        "pct_diff": round(pct_diff, 1),
        "status": alert.status,
        "is_active": alert.is_active,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
        "last_notified_at": alert.last_notified_at.isoformat() if alert.last_notified_at else None,
    }


# ─────────────────────────── Endpoints ─────────────────────────────────────

@router.post("", status_code=201)
def create_alert(
    payload: CreateAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new price drop alert for a product."""
    prod_id_str = str(payload.product_id).strip()
    if prod_id_str.isdigit():
        product = db.query(Product).filter(Product.id == int(prod_id_str)).first()
    else:
        product = db.query(Product).filter(Product.slug == prod_id_str).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.target_price <= 0:
        raise HTTPException(status_code=400, detail="Target price must be positive")

    if payload.target_price >= product.price:
        raise HTTPException(
            status_code=400,
            detail=f"Target price must be below current price ₹{product.price:,.0f}"
        )

    # Check if alert already exists for this product
    existing = db.query(PriceAlert).filter(
        PriceAlert.user_id == current_user.id,
        PriceAlert.product_id == product.id,
        PriceAlert.is_active == True,
    ).first()
    if existing:
        # Update the target price instead
        existing.target_price = payload.target_price
        existing.status = "tracking"
        db.commit()
        db.refresh(existing)
        return _alert_to_dict(existing, product)

    alert = PriceAlert(
        user_id=current_user.id,
        product_id=product.id,
        target_price=payload.target_price,
        initial_price=product.price,
        status="tracking",
        is_active=True,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return _alert_to_dict(alert, product)


@router.get("")
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all price alerts for the current user."""
    alerts = (
        db.query(PriceAlert)
        .options(joinedload(PriceAlert.product))
        .filter(PriceAlert.user_id == current_user.id)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )
    return [_alert_to_dict(a, a.product) for a in alerts if a.product]


@router.put("/{alert_id}")
def update_alert(
    alert_id: int,
    payload: UpdateAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the target price for a price alert."""
    alert = db.query(PriceAlert).options(joinedload(PriceAlert.product)).filter(
        PriceAlert.id == alert_id, PriceAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    product = alert.product
    if payload.target_price <= 0:
        raise HTTPException(status_code=400, detail="Target price must be positive")
    if payload.target_price >= product.price:
        raise HTTPException(
            status_code=400,
            detail=f"Target price must be below current price ₹{product.price:,.0f}"
        )

    alert.target_price = payload.target_price
    alert.status = "tracking"
    db.commit()
    db.refresh(alert)
    return _alert_to_dict(alert, product)


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stop tracking a price alert (deactivate)."""
    alert = db.query(PriceAlert).filter(
        PriceAlert.id == alert_id, PriceAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = False
    db.commit()
    return {"message": "Price alert stopped"}
