"""
Pydantic Schemas for PayNex API
"""
from datetime import datetime
from typing import Optional, Any, Union
from pydantic import BaseModel, EmailStr, field_validator


# ─────────────────────────── Auth ───────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("full_name")
    @classmethod
    def name_min_length(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────── Profile ────────────────────────────────────────

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    phone: Optional[str]
    date_of_birth: Optional[str]
    preferred_categories: list[str]
    budget_min: Optional[float]
    budget_max: Optional[float]
    email_notifications: bool
    price_alerts: bool
    compare_updates: bool

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    preferred_categories: Optional[list[str]] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    email_notifications: Optional[bool] = None
    price_alerts: Optional[bool] = None
    compare_updates: Optional[bool] = None


# ─────────────────────────── Category ───────────────────────────────────────

class CategoryResponse(BaseModel):
    id: int
    slug: str
    name: str
    icon: Optional[str]

    class Config:
        from_attributes = True


# ─────────────────────────── Product ────────────────────────────────────────

class ProductResponse(BaseModel):
    id: int
    slug: str
    name: str
    brand: str
    category: CategoryResponse
    price: float
    original_price: Optional[float]
    rating: float
    reviews_count: int
    image_url: Optional[str]
    description: Optional[str]
    short_description: Optional[str]
    features: list[str]
    specs: dict[str, Any]
    badge: Optional[str]
    in_stock: bool

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ─────────────────────────── Cart ───────────────────────────────────────────

class CartItemResponse(BaseModel):
    id: int
    product: ProductResponse
    quantity: int
    added_at: datetime
    item_total: float

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    subtotal: float
    shipping_cost: float
    total: float
    item_count: int


class AddToCartRequest(BaseModel):
    product_id: Union[int, str]
    quantity: int = 1

    @field_validator("quantity")
    @classmethod
    def quantity_range(cls, v: int) -> int:
        if v < 1 or v > 10:
            raise ValueError("Quantity must be between 1 and 10")
        return v


class UpdateCartRequest(BaseModel):
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_range(cls, v: int) -> int:
        if v < 1 or v > 10:
            raise ValueError("Quantity must be between 1 and 10")
        return v


# ─────────────────────────── Wishlist ───────────────────────────────────────

class WishlistItemResponse(BaseModel):
    id: int
    product: ProductResponse
    added_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────── Orders ─────────────────────────────────────────

class ShippingInfo(BaseModel):
    name: str
    email: str
    phone: str
    address1: str
    address2: Optional[str] = None
    city: str
    state: str
    pincode: str


class CreateOrderRequest(BaseModel):
    shipping: ShippingInfo


class OrderItemResponse(BaseModel):
    id: int
    product_name: str
    product_image: Optional[str]
    unit_price: float
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    paypal_order_id: Optional[str]
    paypal_capture_id: Optional[str]
    status: str
    amount: float
    currency: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    status: str
    subtotal: float
    shipping_cost: float
    total: float
    shipping_name: Optional[str]
    shipping_email: Optional[str]
    shipping_city: Optional[str]
    shipping_state: Optional[str]
    created_at: datetime
    items: list[OrderItemResponse]
    payment: Optional[PaymentResponse]

    class Config:
        from_attributes = True


# ─────────────────────────── Payments ───────────────────────────────────────

class CreatePaypalOrderRequest(BaseModel):
    order_id: int


class CreatePaypalOrderResponse(BaseModel):
    paypal_order_id: str
    approve_url: str


class CapturePaymentRequest(BaseModel):
    paypal_order_id: str


# ─────────────────────────── AI Chat ────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    budget: Optional[float] = None


class ChatProductRef(BaseModel):
    id: int
    slug: str
    name: str
    brand: str
    price: float
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    rating: float = 4.5
    reviews_count: Optional[int] = None
    badge: Optional[str] = None
    short_description: Optional[str] = None
    in_stock: bool = True
    features: Optional[list[str]] = None
    category: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: Optional[int] = None
    message: str
    products: list[ChatProductRef]
    note: Optional[str] = None


# ─────────────────────────── Dashboard ──────────────────────────────────────

class DashboardActivity(BaseModel):
    id: int
    action_type: str
    description: str
    created_at: datetime


class DashboardStats(BaseModel):
    cart_count: int
    wishlist_count: int
    order_count: int
    ai_sessions: int
    comparisons_made: int
    recent_activity: list[DashboardActivity]
