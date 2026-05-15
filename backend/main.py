import logging
import os
import uuid
from time import perf_counter

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from config import config
from models import PhraseCreateRequest
from phrasebook import create_phrase, delete_phrase, list_phrases
from pipeline import process_pipeline
from routes.ai_routes import router as ai_router
from services.ocr_service import extract_text_from_image_bytes
from services.translator_service import get_supported_languages, translate_text
from services.tts_service import text_to_speech
from websocket.stream_translate import stream_translate_session

logger = logging.getLogger("omni_translator")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI()
app.state.started_at = perf_counter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
TEMP_DIR = os.path.join(BASE_DIR, "temp_audio")
EXPORTS_DIR = os.path.join(BASE_DIR, "exports")
FRONTEND_DIST_DIR = os.path.realpath(
    os.environ.get("FRONTEND_DIST_DIR", os.path.join(BASE_DIR, "..", "frontend", "dist"))
)
FRONTEND_INDEX_PATH = os.path.join(FRONTEND_DIST_DIR, "index.html")
FRONTEND_ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, "assets")

os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(EXPORTS_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/audio", StaticFiles(directory=OUTPUTS_DIR), name="audio")
app.mount("/exports", StaticFiles(directory=EXPORTS_DIR), name="exports")
if os.path.isdir(FRONTEND_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS_DIR), name="frontend-assets")

templates = Jinja2Templates(directory=TEMPLATES_DIR)
app.include_router(ai_router)


def _safe_remove(path: str) -> None:
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        logger.warning("cleanup_failed path=%s", path)


def _log_request(route: str, started_at: float, **extra: object) -> None:
    elapsed_ms = round((perf_counter() - started_at) * 1000, 2)
    parts = " ".join([f"{key}={value}" for key, value in extra.items() if value is not None])
    logger.info("route=%s duration_ms=%s %s", route, elapsed_ms, parts)


def _build_export_file(format_type: str, payload: str) -> tuple[str, str]:
    file_id = str(uuid.uuid4())
    if format_type == "txt":
        output_path = os.path.join(EXPORTS_DIR, f"{file_id}.txt")
        with open(output_path, "w", encoding="utf-8") as export_file:
            export_file.write(payload)
        return output_path, "text/plain"

    if format_type == "pdf":
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
        except ImportError as error:
            raise HTTPException(status_code=503, detail="PDF export dependencies are not installed") from error

        output_path = os.path.join(EXPORTS_DIR, f"{file_id}.pdf")
        pdf = canvas.Canvas(output_path, pagesize=A4)
        y = 800
        for line in payload.splitlines() or [""]:
            pdf.drawString(40, y, line[:110])
            y -= 18
            if y < 60:
                pdf.showPage()
                y = 800
        pdf.save()
        return output_path, "application/pdf"

    raise HTTPException(status_code=400, detail="Unsupported export format")


def _suggest_phrases(text: str) -> list[str]:
    normalized = text.lower()
    suggestion_map = {
        "station": ["How much is the ticket?", "Which platform?", "Thank you"],
        "airport": ["Where is the gate?", "How long is the delay?", "I need a taxi"],
        "hotel": ["I have a reservation", "Can I check in now?", "Is breakfast included?"],
        "doctor": ["I need medicine", "Where is the hospital?", "Call emergency services"],
        "food": ["Can I see the menu?", "I am vegetarian", "Please bring water"],
    }

    for keyword, suggestions in suggestion_map.items():
        if keyword in normalized:
            return suggestions

    return ["Please repeat that", "Can you help me?", "Thank you"]


async def _process_audio_file(
    file: UploadFile,
    target_language: str,
    source_language: str,
    voice_profile: str,
    context_hint: str,
):
    started_at = perf_counter()
    file_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"temp_{file_id}.webm")
    allowed_types = {"audio/webm", "audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/mp4"}

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    try:
        max_size_bytes = config.max_upload_size_mb * 1024 * 1024
        size = 0
        with open(input_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_size_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Uploaded file exceeds maximum allowed size of {config.max_upload_size_mb} MB",
                    )
                buffer.write(chunk)

        _ = (voice_profile, context_hint)
        result = process_pipeline(input_path, target_language, source_language)
        _log_request("/process-audio", started_at, source=source_language, target=target_language)
        return result
    except Exception as error:
        if isinstance(error, HTTPException):
            raise
        logger.exception("audio_processing_failed")
        raise HTTPException(status_code=500, detail=str(error)) from error
    finally:
        await file.close()
        _safe_remove(input_path)


def _serve_frontend_index() -> FileResponse:
    if not os.path.exists(FRONTEND_INDEX_PATH):
        raise HTTPException(status_code=503, detail="Frontend build not available")
    return FileResponse(FRONTEND_INDEX_PATH, media_type="text/html")


def _serve_frontend_file(relative_path: str, media_type: str | None = None) -> FileResponse:
    safe_path = relative_path.lstrip("/").replace("\\", "/")
    file_path = os.path.realpath(os.path.join(FRONTEND_DIST_DIR, safe_path))
    if not file_path.startswith(FRONTEND_DIST_DIR) or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(file_path, media_type=media_type)


@app.get("/conversation")
def conversation_home():
    return _serve_frontend_index()


@app.get("/")
def home():
    return _serve_frontend_index()


@app.get("/manifest.webmanifest")
def frontend_manifest():
    return _serve_frontend_file("manifest.webmanifest", media_type="application/manifest+json")


@app.get("/sw.js")
def frontend_service_worker():
    return _serve_frontend_file("sw.js", media_type="application/javascript")


@app.get("/health")
def health():
    return {"status": "ok", "uptime_s": round(perf_counter() - app.state.started_at, 3)}


@app.websocket("/ws/stream-translate")
async def stream_translate(websocket: WebSocket):
    await stream_translate_session(websocket)


@app.get("/languages")
def get_languages():
    try:
        return get_supported_languages()
    except Exception as error:
        logger.exception("language_fetch_failed")
        raise HTTPException(status_code=500, detail="Could not fetch languages") from error


@app.get("/phrases")
def get_phrases():
    return list_phrases()


@app.post("/phrases")
def post_phrase(payload: PhraseCreateRequest):
    if not payload.originalText.strip() or not payload.translatedText.strip():
        raise HTTPException(status_code=400, detail="Phrase text cannot be empty")
    return create_phrase(payload.model_dump())


@app.delete("/phrases/{phrase_id}")
def remove_phrase(phrase_id: int):
    deleted = delete_phrase(phrase_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Phrase not found")
    return {"ok": True}


@app.post("/process")
async def process(
    file: UploadFile = File(...),
    target_language: str = Form("en"),
    source_language: str = Form("auto"),
    voice_profile: str = Form("default"),
    context_hint: str = Form(""),
):
    return await _process_audio_file(file, target_language, source_language, voice_profile, context_hint)


@app.post("/process-audio")
async def process_audio(
    file: UploadFile = File(...),
    target_language: str = Form("en"),
    source_language: str = Form("auto"),
    voice_profile: str = Form("default"),
    context_hint: str = Form(""),
):
    return await _process_audio_file(file, target_language, source_language, voice_profile, context_hint)


@app.post("/process-text")
async def process_text(
    text: str = Form(...),
    target_language: str = Form("en"),
    source_language: str = Form("auto"),
    voice_profile: str = Form("default"),
    context_hint: str = Form(""),
):
    started_at = perf_counter()
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    file_id = str(uuid.uuid4())
    _ = (voice_profile, context_hint)
    try:
        translated = translate_text(text, target_language, source_language)
    except Exception:
        translated = text

    audio_url = ""
    try:
        text_to_speech(translated, target_language, file_id)
        audio_url = f"/audio/{file_id}.mp3"
    except Exception:
        audio_url = ""

    _log_request("/process-text", started_at, source=source_language, target=target_language)
    return {
        "original_text": text,
        "translated_text": translated,
        "audio_url": audio_url,
        "source_language": source_language,
        "target_language": target_language,
        "processing_ms": round((perf_counter() - started_at) * 1000, 2),
    }


@app.post("/translate-image")
async def translate_image(
    file: UploadFile = File(...),
    target_language: str = Form("en"),
    source_language: str = Form("auto"),
):
    started_at = perf_counter()
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Unsupported image format")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 10MB limit")

    extracted_text = extract_text_from_image_bytes(image_bytes)

    try:
        translated_text = translate_text(extracted_text, target_language, source_language)
    except Exception:
        translated_text = extracted_text

    file_id = str(uuid.uuid4())
    audio_url = ""
    try:
        text_to_speech(translated_text, target_language, file_id)
        audio_url = f"/audio/{file_id}.mp3"
    except Exception:
        audio_url = ""

    _log_request("/translate-image", started_at, source=source_language, target=target_language)
    return {
        "original_text": extracted_text,
        "translated_text": translated_text,
        "audio_url": audio_url,
        "source_language": source_language,
        "target_language": target_language,
        "processing_ms": round((perf_counter() - started_at) * 1000, 2),
        "extracted_text": extracted_text,
    }


@app.post("/phrase-suggestions")
async def phrase_suggestions(text: str = Form(...)):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return {"suggestions": _suggest_phrases(text)}


@app.post("/export")
async def export_data(
    content: str = Form(...),
    format_type: str = Form("txt"),
    filename: str = Form("conversation"),
):
    if not content.strip():
        raise HTTPException(status_code=400, detail="Nothing to export")

    output_path, media_type = _build_export_file(format_type, content)
    safe_name = "".join(char for char in filename if char.isalnum() or char in ("-", "_")).strip() or "conversation"
    return FileResponse(output_path, media_type=media_type, filename=f"{safe_name}.{format_type}")


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    if "." in full_path:
        return _serve_frontend_file(full_path)
    if full_path.startswith(("process", "translate", "phrase", "ai", "ws", "audio", "exports", "static", "docs", "openapi", "redoc", "health", "languages")):
        raise HTTPException(status_code=404, detail="Not found")
    return _serve_frontend_index()
