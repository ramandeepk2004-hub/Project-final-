"""Pydantic models for the application API."""
from pydantic import BaseModel


class ProcessResponse(BaseModel):
    """Response model for the process endpoint."""

    original_text: str
    translated_text: str
    audio_url: str
    source_language: str
    target_language: str
    processing_ms: int


class HealthResponse(BaseModel):
    """Response model for the health endpoint."""

    status: str
    uptime_s: float


class LanguageItem(BaseModel):
    """Model representing a supported language."""

    code: str
    name: str


class PhraseCreateRequest(BaseModel):
    originalText: str
    translatedText: str
    category: str
    languagePair: str


class Phrase(BaseModel):
    id: int
    originalText: str
    translatedText: str
    category: str
    languagePair: str
    createdAt: str
