from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from services.camera_ocr_service import camera_translate
from services.pronunciation_service import evaluate_pronunciation
from services.smart_reply_service import generate_smart_replies
from services.summary_service import build_summary_export, generate_summary

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/smart-replies")
async def smart_replies(text: str = Form(...), category: str = Form("")):
    return generate_smart_replies(text, category or None)


@router.post("/summary")
async def summary(payload: dict):
    messages = payload.get("messages", [])
    return generate_summary(messages)


@router.post("/summary/export")
async def summary_export(payload: dict):
    content = payload.get("content", "")
    format_type = payload.get("format_type", "txt")
    data, media_type, filename = build_summary_export(content, format_type)
    return Response(content=data, media_type=media_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.post("/pronunciation")
async def pronunciation(
    file: UploadFile = File(...),
    expected_text: str = Form(...),
    source_language: str = Form("auto"),
):
    return evaluate_pronunciation(file, expected_text, source_language)


@router.post("/camera-translate")
async def camera_translate_route(
    file: UploadFile = File(...),
    target_language: str = Form("en"),
    source_language: str = Form("auto"),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Camera frame must be an image")
    return camera_translate(file, target_language, source_language)
