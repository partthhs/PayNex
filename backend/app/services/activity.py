"""Activity logging service"""
from sqlalchemy.orm import Session
from app.models import ActivityLog


def log_activity(db: Session, user_id: int, action_type: str, description: str, metadata: dict = None) -> None:
    """Log a user activity to the database."""
    try:
        entry = ActivityLog(
            user_id=user_id,
            action_type=action_type,
            description=description,
            extra_data=metadata or {},
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        # Don't let activity logging break core functionality
        db.rollback()
        print(f"[ActivityLog] Failed to log activity: {e}")
