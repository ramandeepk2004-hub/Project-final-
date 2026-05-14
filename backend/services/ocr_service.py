from __future__ import annotations

from functools import lru_cache

import numpy as np
from fastapi import HTTPException
from PIL import Image


def _preprocess_for_ocr(image: Image.Image) -> Image.Image:
    from PIL import ImageEnhance, ImageFilter, ImageOps

    rgb = image.convert("RGB")
    width, height = rgb.size
    if width < 1600:
        scale = 1600 / max(width, 1)
        rgb = rgb.resize((int(width * scale), int(height * scale)))

    gray = ImageOps.grayscale(rgb)
    denoised = gray.filter(ImageFilter.MedianFilter(size=3))
    contrasted = ImageEnhance.Contrast(denoised).enhance(1.8)
    return contrasted.point(lambda p: 255 if p > 145 else 0)


@lru_cache(maxsize=1)
def _rapidocr_reader():
    try:
        from rapidocr_onnxruntime import RapidOCR
    except Exception as error:
        raise RuntimeError("rapidocr_unavailable") from error

    return RapidOCR()


def _extract_with_tesseract(image: Image.Image) -> str:
    try:
        import pytesseract
    except Exception as error:
        raise RuntimeError("pytesseract_unavailable") from error

    try:
        return pytesseract.image_to_string(image, config="--oem 3 --psm 6").strip()
    except Exception as error:
        # Most common case: executable not installed / not in PATH.
        raise RuntimeError("tesseract_runtime_unavailable") from error


def _extract_with_rapidocr(image: Image.Image) -> str:
    reader = _rapidocr_reader()
    arr = np.array(image)
    result, _ = reader(arr)
    if not result:
        return ""
    texts = [item[1].strip() for item in result if len(item) > 1 and str(item[1]).strip()]
    return "\n".join(texts).strip()


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    try:
        import io

        image = Image.open(io.BytesIO(image_bytes))
    except Exception as error:
        raise HTTPException(status_code=400, detail="Invalid image file") from error

    processed = _preprocess_for_ocr(image)

    text = ""
    try:
        text = _extract_with_tesseract(processed)
    except RuntimeError:
        text = ""

    if not text:
        try:
            text = _extract_with_rapidocr(processed)
        except RuntimeError as error:
            raise HTTPException(
                status_code=503,
                detail="OCR backend unavailable. Install rapidocr-onnxruntime or install Tesseract and add it to PATH.",
            ) from error

    clean = (text or "").strip()
    if not clean:
        raise HTTPException(status_code=422, detail="No text detected in image")

    return clean
