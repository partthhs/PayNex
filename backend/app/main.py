"""
PayNex FastAPI Backend — Entry Point
"""
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import engine, SessionLocal, Base
from app.routers import auth, products, cart, wishlist, orders, payments, ai, dashboard, planner, price_alerts, notifications
from app.services.seed import seed_database
from app.utils.price_monitor import price_monitor_loop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("paynex")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and seed initial data."""
    logger.info("PayNex API starting up...")

    # Import all models so SQLAlchemy knows about them
    from app.models import (  # noqa: F401
        User, UserProfile, Category, Product, CartItem,
        WishlistItem, Order, OrderItem, Payment,
        AIConversation, AIMessage, ActivityLog,
        ShoppingPlan, ShoppingPlanItem, PriceAlert, Notification,
    )

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified.")

    # Seed product catalog
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start background price monitor
    monitor_task = asyncio.create_task(price_monitor_loop(interval_seconds=1800))

    yield  # App is running

    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass
    logger.info("PayNex API shutting down.")


app = FastAPI(
    title="PayNex API",
    description="AI-powered intelligent shopping and payment platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers under /api/v1
PREFIX = settings.API_V1_PREFIX

app.include_router(auth.router,       prefix=PREFIX)
app.include_router(products.router,   prefix=PREFIX)
app.include_router(cart.router,       prefix=PREFIX)
app.include_router(wishlist.router,   prefix=PREFIX)
app.include_router(orders.router,     prefix=PREFIX)
app.include_router(payments.router,   prefix=PREFIX)
app.include_router(ai.router,            prefix=PREFIX)
app.include_router(dashboard.router,     prefix=PREFIX)
app.include_router(planner.router,       prefix=PREFIX)
app.include_router(price_alerts.router,  prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)

# Serve local static assets (including cached high-resolution product images)
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
