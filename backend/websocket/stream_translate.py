from __future__ import annotations

import asyncio
import json
import tempfile
from typing import Any

from fastapi import WebSocket

from services.speech_service import speech_to_text
from services.translator_service import translate_text


async def stream_translate_session(websocket: WebSocket) -> None:
    await websocket.accept()

    buffer_text = ""
    target_language = "en"
    source_language = "auto"

    try:
        while True:
            message = await websocket.receive_text()
            payload = json.loads(message)

            event = payload.get("event", "partial")
            target_language = payload.get("target_language", target_language)
            source_language = payload.get("source_language", source_language)

            if event == "audio_chunk" and payload.get("audio_base64"):
                # Placeholder for true streaming decode path; keeps socket protocol stable.
                partial_original = payload.get("hint_text", "")
                partial_translation = translate_text(partial_original, target_language, source_language) if partial_original else ""
                await websocket.send_json({
                    "partial_original": partial_original,
                    "partial_translation": partial_translation,
                    "is_final": False,
                })
                continue

            if event == "partial":
                chunk = payload.get("text_chunk", "")
                buffer_text = f"{buffer_text} {chunk}".strip()
                partial_translation = translate_text(buffer_text, target_language, source_language) if buffer_text else ""
                await websocket.send_json({
                    "partial_original": buffer_text,
                    "partial_translation": partial_translation,
                    "is_final": False,
                })
                continue

            if event == "final":
                final_text = (payload.get("final_text") or buffer_text).strip()
                translated = translate_text(final_text, target_language, source_language) if final_text else ""
                await websocket.send_json({
                    "original_text": final_text,
                    "translated_text": translated,
                    "audio_url": "",
                    "is_final": True,
                })
                buffer_text = ""
                continue

            await websocket.send_json({"detail": "Unknown stream event"})
    except Exception:
        await websocket.close()
