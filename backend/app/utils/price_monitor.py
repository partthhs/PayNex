"""
Background Price Monitor Task
Checks active price alerts against current product prices.
Generates notifications when target prices are reached or prices drop.
"""
import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import joinedload
from app.database import SessionLocal
from app.models import PriceAlert, Product, Notification

logger = logging.getLogger("paynex.price_monitor")


def check_price_alerts():
    """Evaluate all active price alerts and issue notifications if target met."""
    db = SessionLocal()
    try:
        alerts = (
            db.query(PriceAlert)
            .options(joinedload(PriceAlert.product))
            .filter(PriceAlert.is_active == True)
            .all()
        )

        for alert in alerts:
            product = alert.product
            if not product:
                continue

            # Check if current price meets or drops below user's target price
            if product.price <= alert.target_price:
                # If not previously notified at this price level
                if alert.status != "target_reached":
                    alert.status = "target_reached"
                    alert.last_notified_at = datetime.utcnow()

                    # Create in-app notification
                    notif = Notification(
                        user_id=alert.user_id,
                        title="Price Drop Alert!",
                        message=f"{product.name} is now available at ₹{product.price:,.0f}! Your target was ₹{alert.target_price:,.0f}.",
                        type="target_reached",
                        link=f"/product/{product.slug}",
                    )
                    db.add(notif)
                    logger.info(f"Price alert triggered for user {alert.user_id} on {product.name}")
            elif product.price < alert.initial_price:
                # Price dropped from initial, but hasn't reached target yet
                if alert.status == "tracking":
                    alert.status = "price_dropped"
            else:
                # Price is back above target
                if alert.status == "target_reached":
                    alert.status = "tracking"

        db.commit()
    except Exception as e:
        logger.error(f"Error checking price alerts: {e}")
        db.rollback()
    finally:
        db.close()


async def price_monitor_loop(interval_seconds: int = 1800):
    """Periodic loop to monitor product prices."""
    logger.info("Price monitor background service started.")
    while True:
        try:
            check_price_alerts()
        except Exception as e:
            logger.error(f"Price monitor loop exception: {e}")
        await asyncio.sleep(interval_seconds)
