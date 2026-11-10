"""
Gemini AI integration for PayNex shopping assistant.
"""
import json
import re
from typing import Optional
import google.generativeai as genai

from app.config import settings


def _build_system_prompt(catalog_json: str) -> str:
    return f"""You are PayNex AI, an intelligent shopping assistant.
Your job is to help users find the right products from the PayNex catalog.

PRODUCT CATALOG (JSON):
{catalog_json}

INSTRUCTIONS:
1. Understand the user's requirements in natural language.
2. Extract: product type, budget, key specifications, preferences.
3. Search the catalog for matching products.
4. Return a helpful, concise response.
5. ALWAYS include product recommendations as a JSON block at the end of your response.
6. Format the JSON block like this (after your text):
   PRODUCTS_JSON: ["product-slug-1", "product-slug-2", "product-slug-3"]
7. Only include slugs of products that genuinely match the user's needs.
8. If nothing matches, explain why and suggest alternatives.
9. Keep responses friendly, concise and informative.
10. Do NOT invent prices, specs, or availability beyond what's in the catalog.
11. Answer in English.
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
        if not self._configured:
            return self._fallback_response(user_message, budget)

        # Build Gemini history (list of Content objects)
        gemini_history = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})

        system_prompt = _build_system_prompt(catalog_json)
        # Prepend system context to first user turn
        full_message = system_prompt + "\n\nUser: " + user_message
        if budget:
            full_message += f"\n[User's declared budget ceiling: ₹{budget:,.0f}]"

        try:
            chat_session = self._model.start_chat(history=gemini_history)
            response = chat_session.send_message(full_message)
            ai_text = response.text
            slugs = _extract_product_slugs(ai_text)
            clean_text = _clean_response(ai_text)
            return {"text": clean_text, "product_slugs": slugs}
        except Exception as e:
            print(f"[GeminiAssistant] API error: {e}")
            return self._fallback_response(user_message, budget)

    def _fallback_response(self, query: str, budget: Optional[float]) -> dict:
        """
        Simple keyword-based fallback when Gemini is unavailable.
        Returns a message indicating Gemini is not configured.
        """
        return {
            "text": (
                "I found some products that may match your requirements. "
                "For more intelligent AI-powered recommendations, please configure the GEMINI_API_KEY in the backend .env file."
            ),
            "product_slugs": [],
            "note": "AI fallback mode: Gemini API key not configured.",
        }


# Singleton instance
gemini_assistant = GeminiAssistant()
