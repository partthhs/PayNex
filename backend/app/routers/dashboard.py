"""Dashboard and Profile routers"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserProfile, CartItem, WishlistItem, Order, AIConversation, ActivityLog
from app.schemas import DashboardStats, DashboardActivity, ProfileResponse, ProfileUpdateRequest, UserResponse
from app.utils.auth import get_current_user

router = APIRouter(tags=["Dashboard & Profile"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_count = db.query(CartItem).filter(CartItem.user_id == current_user.id).count()
    wishlist_count = db.query(WishlistItem).filter(WishlistItem.user_id == current_user.id).count()
    order_count = db.query(Order).filter(Order.user_id == current_user.id).count()
    ai_sessions = db.query(AIConversation).filter(AIConversation.user_id == current_user.id).count()

    # Count distinct product comparisons from activity log
    comparisons = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.action_type == "compare",
        )
        .count()
    )

    recent = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardStats(
        cart_count=cart_count,
        wishlist_count=wishlist_count,
        order_count=order_count,
        ai_sessions=ai_sessions,
        comparisons_made=comparisons,
        recent_activity=[
            DashboardActivity(
                id=a.id,
                action_type=a.action_type,
                description=a.description,
                created_at=a.created_at,
            )
            for a in recent
        ],
    )


@router.get("/profile", response_model=dict)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": profile.phone if profile else None,
        "date_of_birth": profile.date_of_birth if profile else None,
        "preferred_categories": profile.preferred_categories if profile else [],
        "budget_min": profile.budget_min if profile else None,
        "budget_max": profile.budget_max if profile else None,
        "email_notifications": profile.email_notifications if profile else True,
        "price_alerts": profile.price_alerts if profile else True,
        "compare_updates": profile.compare_updates if profile else False,
    }


@router.put("/profile", response_model=dict)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Update User table fields
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()

    # Upsert UserProfile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id, preferred_categories=[])
        db.add(profile)

    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.date_of_birth is not None:
        profile.date_of_birth = payload.date_of_birth
    if payload.preferred_categories is not None:
        profile.preferred_categories = payload.preferred_categories
    if payload.budget_min is not None:
        profile.budget_min = payload.budget_min
    if payload.budget_max is not None:
        profile.budget_max = payload.budget_max
    if payload.email_notifications is not None:
        profile.email_notifications = payload.email_notifications
    if payload.price_alerts is not None:
        profile.price_alerts = payload.price_alerts
    if payload.compare_updates is not None:
        profile.compare_updates = payload.compare_updates

    db.commit()
    db.refresh(current_user)
    return get_profile(db=db, current_user=current_user)
