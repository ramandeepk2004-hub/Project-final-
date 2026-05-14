from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from threading import Lock
from typing import Any

PHRASEBOOK_PATH = os.path.join(os.path.dirname(__file__), "phrasebook.json")
_lock = Lock()


def _read_phrases() -> list[dict[str, Any]]:
    if not os.path.exists(PHRASEBOOK_PATH):
        return []
    with open(PHRASEBOOK_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _write_phrases(phrases: list[dict[str, Any]]) -> None:
    with open(PHRASEBOOK_PATH, "w", encoding="utf-8") as fh:
        json.dump(phrases, fh, ensure_ascii=False, indent=2)


def list_phrases() -> list[dict[str, Any]]:
    with _lock:
        phrases = _read_phrases()
        phrases.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return phrases


def create_phrase(payload: dict[str, Any]) -> dict[str, Any]:
    with _lock:
        phrases = _read_phrases()
        next_id = (max((int(p["id"]) for p in phrases), default=0) + 1)
        phrase = {
            "id": next_id,
            "originalText": payload["originalText"],
            "translatedText": payload["translatedText"],
            "category": payload["category"],
            "languagePair": payload["languagePair"],
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        phrases.append(phrase)
        _write_phrases(phrases)
        return phrase


def delete_phrase(phrase_id: int) -> bool:
    with _lock:
        phrases = _read_phrases()
        filtered = [p for p in phrases if int(p["id"]) != int(phrase_id)]
        if len(filtered) == len(phrases):
            return False
        _write_phrases(filtered)
        return True
