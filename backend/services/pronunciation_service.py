from __future__ import annotations

import difflib
import os
import tempfile
from typing import Any

from fastapi import HTTPException, UploadFile

from services.speech_service import speech_to_text


def evaluate_pronunciation(audio_file: UploadFile, expected_text: str, source_language: str = "auto") -> dict[str, Any]:
    if not expected_text.strip():
        raise HTTPException(status_code=400, detail="Expected text is required")

    suffix = os.path.splitext(audio_file.filename or "audio.webm")[1] or ".webm"
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        data = audio_file.file.read()
        temp.write(data)
        temp.close()

        recognized = speech_to_text(temp.name, source_language)
        ratio = difflib.SequenceMatcher(None, expected_text.lower().strip(), recognized.lower().strip()).ratio()
        score = int(round(ratio * 100))

        feedback: list[str] = []
        if score < 60:
            feedback.append("Speak more slowly and clearly.")
            feedback.append("Focus on key consonants and vowels.")
        elif score < 80:
            feedback.append("Good attempt. Improve vowel clarity.")
            feedback.append("Try a steadier speaking pace.")
        else:
            feedback.append("Great pronunciation overall.")
            feedback.append("Try natural intonation for fluency.")

        return {
            "score": score,
            "recognized_text": recognized,
            "expected_text": expected_text,
            "fluency": max(40, min(100, score + 5)),
            "confidence": max(35, min(100, score + 8)),
            "clarity": max(30, min(100, score + 3)),
            "feedback": feedback,
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Pronunciation evaluation failed: {error}") from error
    finally:
        try:
            os.unlink(temp.name)
        except Exception:
            pass
