"""
Gemini AI integration for PayNex shopping assistant.
"""
import json
import re
from typing import Optional
import google.generativeai as genai

from app.config import settings


def extract_budget(text: str) -> Optional[float]:
    """Extract declared budget from natural language input."""
    # Matches: under ₹70,000, under 70000, under 70k, below 30k, budget 10,000, max 1.2 lakh
    pattern = r'(?:under|below|budget|within|max|less than|up to)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)\s*(k|thousand|lakh|lac)?'
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        num_str = m.group(1).replace(',', '')
        try:
            val = float(num_str)
            unit = (m.group(2) or '').lower()
            if unit in ('k', 'thousand'):
                val *= 1000
            elif unit in ('lakh', 'lac'):
                val *= 100000
            return val
        except ValueError:
            pass
    return None


def extract_category(text: str) -> Optional[str]:
    """Detect specific category from user query."""
    t = text.lower()
    if re.search(r'\b(laptop|laptops|notebook|notebooks|macbook|pc|computer)\b', t):
        return 'laptops'
    if re.search(r'\b(phone|phones|smartphone|smartphones|mobile|mobiles|iphone|android)\b', t):
        return 'smartphones'
    if re.search(r'\b(headphone|headphones|earphone|earphones|earbuds|airpods|headset|audio)\b', t):
        return 'headphones'
    if re.search(r'\b(tablet|tablets|ipad)\b', t):
        return 'tablets'
    if re.search(r'\b(camera|cameras|dslr|lens)\b', t):
        return 'cameras'
    if re.search(r'\b(watch|watches|smartwatch|smartwatches)\b', t):
        return 'smartwatches'
    if re.search(r'\b(speaker|speakers)\b', t):
        return 'speakers'
    if re.search(r'\b(mouse|keyboard|charger|accessory|accessories)\b', t):
        return 'accessories'
    return None


def _build_system_prompt(catalog_json: str) -> str:
    return f"""You are PayNex AI, an expert, objective shopping assistant and tech evaluation advisor.
Your job is to provide accurate, comprehensive, and helpful buying advice based strictly on the verified PayNex product catalog.

PRODUCT CATALOG (JSON):
{catalog_json}

CRITICAL RULES:
1. STRICT BUDGET CEILING:
   - If the user specifies a budget (e.g., "under ₹70,000", "below 30k", "under ₹5,000"), you must NEVER recommend any product priced higher than that budget in PRODUCTS_JSON.
   - Products exceeding the declared budget are strictly disqualified.
   - If no products in the catalog fit within the user's budget, output PRODUCTS_JSON: [] (empty list). Clearly explain that no products meet the budget criteria in the catalog, state the lowest available starting price for the category, and do not show higher-priced cards.

2. CATEGORY RELEVANCE:
   - When a user asks for a category (e.g., laptops, smartphones, headphones, smartwatches, speakers, tablets, accessories, cameras), recommend ONLY items from that specific category. Never mix unrelated categories.

3. COMPREHENSIVE & STRUCTURED INSIGHTS:
   - Provide a well-structured, insightful response explaining:
     * Key specifications (e.g. processor, RAM, battery, display, noise cancellation)
     * Why the product fits the user's specific use case (e.g. coding, multitasking, battery life, value for money)
     * Value proposition (pros and highlighted advantages)
   - Use clear markdown formatting (bolding product names, bullet points for key features).

4. DATA AUTHENTICITY:
   - Do NOT fabricate prices, specifications, or model numbers not present in the catalog.
   - Quote exact prices (in ₹ INR) and specs from the catalog.

5. RESPONSE FORMAT:
   - Write your comprehensive, formatted evaluation first.
   - At the VERY END of your response, output the matching product slugs in this exact format:
     PRODUCTS_JSON: ["slug-1", "slug-2"]
   - If no products match, output:
     PRODUCTS_JSON: []
"""


def _extract_product_slugs(ai_text: str) -> list[str]:
    """Extract the PRODUCTS_JSON list from the AI response."""
    match = re.search(r'PRODUCTS_JSON:\s*(\[.*?\])', ai_text, re.DOTALL)
    if match:
        try:
            slugs = json.loads(match.group(1))
            return [s for s in slugs if isinstance(s, str)]
        except (json.JSONDecodeError, ValueError):
            pass
    return []


def _clean_response(text: str) -> str:
    """Remove the PRODUCTS_JSON block from displayed text."""
    return re.sub(r'\nPRODUCTS_JSON:.*', '', text, flags=re.DOTALL).strip()


class GeminiAssistant:
    def __init__(self):
        self._configured = False
        if settings.GEMINI_API_KEY:
            try:
                try:
                    import truststore
                    truststore.inject_into_ssl()
                except Exception:
                    pass
                genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")
                self._model = genai.GenerativeModel(settings.GEMINI_MODEL)
                self._configured = True
            except Exception as e:
                print(f"[GeminiAssistant] Configuration error: {e}")

    def is_available(self) -> bool:
        return self._configured

    async def chat(
        self,
        user_message: str,
        history: list[dict],
        catalog_json: str,
        budget: Optional[float] = None,
    ) -> dict:
        """
        Send a message to Gemini and return {text, product_slugs}.
        Falls back to rule-based matching if Gemini is not configured.
        """
        effective_budget = budget or extract_budget(user_message)
        detected_category = extract_category(user_message)

        if not self._configured:
            return self._fallback_response(user_message, effective_budget, detected_category)

        # Build Gemini history (list of Content objects)
        gemini_history = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})

        system_prompt = _build_system_prompt(catalog_json)
        full_message = system_prompt + "\n\nUser: " + user_message
        if effective_budget:
            full_message += f"\n[STRICT BUDGET CEILING: ₹{effective_budget:,.0f} - DO NOT RECOMMEND PRODUCTS ABOVE THIS PRICE]"
        if detected_category:
            full_message += f"\n[STRICT CATEGORY FILTER: Only recommend products from category '{detected_category}']"

        try:
            chat_session = self._model.start_chat(history=gemini_history)
            response = chat_session.send_message(full_message)
            ai_text = response.text
            slugs = _extract_product_slugs(ai_text)
            clean_text = _clean_response(ai_text)
            return {"text": clean_text, "product_slugs": slugs}
        except Exception as e:
            print(f"[GeminiAssistant] API error: {e}")
            return self._fallback_response(user_message, effective_budget, detected_category)

    def _fallback_response(self, query: str, budget: Optional[float], category: Optional[str]) -> dict:
        """Rule-based fallback if Gemini is offline."""
        category_str = f"in category '{category}'" if category else ""
        budget_str = f"under ₹{budget:,.0f}" if budget else ""
        return {
            "text": (
                f"I evaluated your shopping requirements {category_str} {budget_str}. "
                "For more detailed AI assistance, please ensure GEMINI_API_KEY is configured."
            ),
            "product_slugs": [],
            "note": "AI assistant fallback evaluation.",
        }


# Singleton instance
gemini_assistant = GeminiAssistant()
