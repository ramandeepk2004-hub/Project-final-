from __future__ import annotations

from typing import Literal

CATEGORIES: tuple[str, ...] = (
    "travel",
    "emergency",
    "healthcare",
    "hotel",
    "restaurant",
    "shopping",
    "business",
    "casual conversation",
)

_CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "travel": ("airport", "station", "ticket", "train", "bus", "gate", "platform", "visa"),
    "emergency": ("help", "emergency", "police", "danger", "urgent", "accident"),
    "healthcare": ("doctor", "hospital", "medicine", "pain", "clinic", "ambulance"),
    "hotel": ("hotel", "check-in", "reservation", "room", "checkout"),
    "restaurant": ("menu", "food", "table", "restaurant", "bill", "vegetarian"),
    "shopping": ("price", "shop", "discount", "buy", "cost", "size"),
    "business": ("meeting", "proposal", "invoice", "deadline", "contract", "client"),
}

_REPLY_BANK: dict[str, list[str]] = {
    "travel": ["Which platform should I go to?", "How far is it from here?", "Can you guide me on the map?"],
    "emergency": ["Please help me immediately.", "Can you call emergency services?", "Where is the nearest safe place?"],
    "healthcare": ["I need medical help.", "Can you call a doctor?", "Where is the nearest pharmacy?"],
    "hotel": ["I have a reservation.", "Can I check in now?", "Is breakfast included?"],
    "restaurant": ["Can I see the menu?", "I am vegetarian.", "Please bring water."],
    "shopping": ["What is the final price?", "Do you have a discount?", "Can I pay by card?"],
    "business": ["Let's schedule a meeting.", "Please share the proposal.", "What is the delivery timeline?"],
    "casual conversation": ["Please repeat that.", "Can you help me?", "Thank you."],
}


def detect_category(text: str) -> str:
    normalized = text.lower()
    for category, keywords in _CATEGORY_KEYWORDS.items():
      if any(keyword in normalized for keyword in keywords):
          return category
    return "casual conversation"


def generate_smart_replies(text: str, category: str | None = None) -> dict[str, object]:
    selected = category if category in CATEGORIES else detect_category(text)
    replies = _REPLY_BANK.get(selected, _REPLY_BANK["casual conversation"])
    return {"category": selected, "replies": replies}
