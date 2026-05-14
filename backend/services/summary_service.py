from __future__ import annotations

from collections import Counter
from datetime import datetime
from io import BytesIO
from typing import Iterable

from fastapi import HTTPException


def _keywords(text: str, limit: int = 8) -> list[str]:
    words = [w.strip(".,!?;:\"'()[]{}") for w in text.lower().split()]
    words = [w for w in words if len(w) > 3 and w.isalpha()]
    common = Counter(words).most_common(limit)
    return [w for w, _ in common]


def generate_summary(messages: list[dict[str, str]]) -> dict[str, object]:
    if not messages:
        return {"summary": "No conversation available.", "keywords": [], "language_pairs": [], "timestamps": []}

    combined = "\n".join([m.get("translatedText") or m.get("translated_text") or "" for m in messages]).strip()
    first_lines = [line for line in combined.splitlines() if line.strip()][:5]
    summary = " ".join(first_lines) if first_lines else "Conversation captured successfully."

    pairs = sorted({
        f"{m.get('sourceLanguage') or m.get('source_language','auto')} -> {m.get('targetLanguage') or m.get('target_language','en')}"
        for m in messages
    })
    timestamps = [m.get("timestamp") for m in messages if m.get("timestamp")]

    return {
        "summary": summary,
        "keywords": _keywords(combined),
        "language_pairs": pairs,
        "timestamps": timestamps,
        "message_count": len(messages),
    }


def build_summary_export(content: str, format_type: str) -> tuple[bytes, str, str]:
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    if format_type == "txt":
        data = content.encode("utf-8")
        return data, "text/plain", f"summary-{stamp}.txt"

    if format_type == "pdf":
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
        except Exception as error:
            raise HTTPException(status_code=503, detail="PDF dependencies unavailable") from error

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        y = 800
        for line in content.splitlines() or [""]:
            pdf.drawString(40, y, line[:110])
            y -= 18
            if y < 60:
                pdf.showPage()
                y = 800
        pdf.save()
        return buffer.getvalue(), "application/pdf", f"summary-{stamp}.pdf"

    if format_type == "docx":
        try:
            from docx import Document
        except Exception as error:
            raise HTTPException(status_code=503, detail="DOCX dependencies unavailable") from error

        doc = Document()
        for line in content.splitlines() or [""]:
            doc.add_paragraph(line)
        out = BytesIO()
        doc.save(out)
        return out.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", f"summary-{stamp}.docx"

    raise HTTPException(status_code=400, detail="Unsupported summary format")
