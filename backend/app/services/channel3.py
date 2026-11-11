"""
PayNex Channel3 Commerce Service
Provides product search, URL lookup, product details retrieval,
and response normalization to PayNex product format with reliable fallbacks.
"""
import logging
import httpx
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("paynex.channel3")

# Conversion rate USD to INR (estimated market fallback if currency conversion needed)
USD_TO_INR_RATE = 83.5

class Channel3Service:
    def __init__(self):
        self.api_key = settings.CHANNEL3_API_KEY
        self.base_url = settings.CHANNEL3_BASE_URL.rstrip('/')
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "PayNex-Commerce/1.0",
        }
        if self.api_key:
            self.headers["x-api-key"] = self.api_key

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def normalize_product(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a Channel3 product object into PayNex's standard product schema.
        Ensures clear merchant badge, buy_url preservation, and separate handling from local cart.
        """
        product_id = raw_item.get("product_id") or raw_item.get("id") or "ch3_unknown"
        title = raw_item.get("title") or raw_item.get("name") or "External Product"
        brand = raw_item.get("brand") or "Verified Partner"
        description = raw_item.get("description") or ""

        # Price and currency extraction
        raw_price = raw_item.get("price")
        currency = raw_item.get("currency", "USD")
        
        # If price is inside an offer object
        offers = raw_item.get("offers", [])
        primary_offer = offers[0] if offers else {}
        if not raw_price and primary_offer:
            offer_price_obj = primary_offer.get("price", {})
            if isinstance(offer_price_obj, dict):
                raw_price = offer_price_obj.get("amount", 0)
                currency = offer_price_obj.get("currency", currency)
            elif isinstance(offer_price_obj, (int, float)):
                raw_price = offer_price_obj

        # Normalize price to numeric float
        try:
            numeric_price = float(raw_price or 0.0)
        except (ValueError, TypeError):
            numeric_price = 0.0

        # Convert to INR representation for unified PayNex display if USD
        if currency.upper() == "USD" and numeric_price > 0:
            price_inr = round(numeric_price * USD_TO_INR_RATE)
            original_price_inr = round(price_inr * 1.15)
        else:
            price_inr = round(numeric_price)
            original_price_inr = round(price_inr * 1.15) if price_inr > 0 else 0

        # Images extraction
        images = raw_item.get("images", [])
        image_url = ""
        if isinstance(images, list) and images:
            image_url = images[0]
        elif isinstance(images, str):
            image_url = images
        if not image_url:
            image_url = raw_item.get("image_url") or "https://placehold.co/400x300/EFF6FF/1D4ED8?text=Merchant+Product"

        # Merchant info and buy link
        merchant_name = "Online Retailer"
        if raw_item.get("merchant"):
            m = raw_item.get("merchant")
            if isinstance(m, dict):
                merchant_name = m.get("name") or m.get("website_id") or merchant_name
            elif isinstance(m, str):
                merchant_name = m
        elif primary_offer.get("merchant"):
            merchant_name = primary_offer.get("merchant")

        buy_url = raw_item.get("buy_url") or primary_offer.get("url") or ""

        # Construct PayNex standard payload
        return {
            "id": f"ch3_{product_id}",
            "slug": f"ch3-{product_id}",
            "name": title,
            "brand": brand,
            "category": "External Partner",
            "price": price_inr,
            "original_price": original_price_inr,
            "description": description,
            "short_description": description[:160] if description else title,
            "image_url": image_url,
            "badge": f"Via {merchant_name}",
            "is_external": True,
            "merchant_name": merchant_name,
            "external_url": buy_url,
            "currency": currency,
            "original_amount": numeric_price,
            "specs": raw_item.get("attributes", {}),
            "in_stock": True,
            "is_active": True
        }

    async def search_products(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search products via Channel3 POST /v1/search endpoint.
        Returns normalized PayNex product objects.
        """
        if not self.is_configured:
            logger.info("Channel3 API key not configured. Skipping Channel3 query.")
            return []

        payload = {
            "query": query,
            "config": {
                "mode": "agentic"
            },
            "limit": min(limit, 20)
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/search",
                    headers=self.headers,
                    json=payload
                )
                if res.status_code == 200:
                    data = res.json()
                    raw_products = data.get("products", [])
                    return [self.normalize_product(p) for p in raw_products]
                elif res.status_code == 429:
                    logger.warning("Channel3 rate limit encountered. Falling back to internal DB.")
                    return []
                else:
                    logger.error(f"Channel3 search failed [{res.status_code}]: {res.text[:200]}")
                    return []
        except httpx.TimeoutException:
            logger.warning("Channel3 search timed out. Falling back.")
            return []
        except Exception as e:
            logger.error(f"Channel3 unexpected search error: {e}")
            return []

    async def get_product_detail(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch single product detail via GET /v1/products/{product_id}.
        """
        if not self.is_configured:
            return None

        # Strip prefix if passed as ch3_...
        clean_id = product_id.replace("ch3_", "").replace("ch3-", "")

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(
                    f"{self.base_url}/products/{clean_id}",
                    headers=self.headers
                )
                if res.status_code == 200:
                    return self.normalize_product(res.json())
                return None
        except Exception as e:
            logger.error(f"Channel3 get_product_detail error: {e}")
            return None


channel3_service = Channel3Service()
