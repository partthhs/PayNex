"""
PayPal Sandbox payment utility using the PayPal Orders API v2 via httpx.
We use httpx directly instead of paypalrestsdk to get full v2 API support.
"""
import httpx
import base64
from typing import Optional
from app.config import settings


PAYPAL_BASE = settings.PAYPAL_BASE_URL


async def _get_access_token() -> str:
    """Exchange client credentials for a PayPal access token."""
    if not settings.PAYPAL_CLIENT_ID or not settings.PAYPAL_CLIENT_SECRET:
        raise ValueError("PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env")

    credentials = f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_CLIENT_SECRET}"
    encoded = base64.b64encode(credentials.encode()).decode()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_BASE}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {encoded}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials"},
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def create_paypal_order(
    amount_inr: float,
    order_ref: str,
    return_url: str,
    cancel_url: str,
) -> dict:
    """
    Create a PayPal order.

    PayPal processes in USD. We use a fixed approximate exchange rate for sandbox.
    In production, use a live currency conversion API.
    """
    INR_TO_USD = 0.012   # Approximate — replace with live rate in production
    amount_usd = round(amount_inr * INR_TO_USD, 2)

    access_token = await _get_access_token()

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": order_ref,
                "description": f"PayNex Order #{order_ref}",
                "amount": {
                    "currency_code": "USD",
                    "value": str(amount_usd),
                },
            }
        ],
        "application_context": {
            "brand_name": "PayNex",
            "landing_page": "NO_PREFERENCE",
            "user_action": "PAY_NOW",
            "return_url": return_url,
            "cancel_url": cancel_url,
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_BASE}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()

    # Find the approve URL
    approve_url = next(
        (link["href"] for link in data.get("links", []) if link["rel"] == "approve"),
        None,
    )
    return {"paypal_order_id": data["id"], "approve_url": approve_url, "raw": data}


async def capture_paypal_order(paypal_order_id: str) -> dict:
    """
    Capture an approved PayPal order. This is the step that actually charges the buyer.
    NEVER trust client-side success messages — always call this server-side.
    """
    access_token = await _get_access_token()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_BASE}/v2/checkout/orders/{paypal_order_id}/capture",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()


async def get_paypal_order(paypal_order_id: str) -> dict:
    """Retrieve the current status of a PayPal order."""
    access_token = await _get_access_token()

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PAYPAL_BASE}/v2/checkout/orders/{paypal_order_id}",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()
