from __future__ import annotations
from fastapi import HTTPException, UploadFile

from services.ocr_service import extract_text_from_image_bytes
from services.translator_service import translate_text


def camera_translate(file: UploadFile, target_language: str, source_language: str = "auto") -> dict[str, object]:
    data = file.file.read()
    full_text = extract_text_from_image_bytes(data)
    full_translation = translate_text(full_text, target_language, source_language)

    return {
        "original_text": full_text,
        "translated_text": full_translation,
        "blocks": [],
        "source_language": source_language,
        "target_language": target_language,
    }
