"""Pytest fixtures for the application."""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch
from main import app

@pytest.fixture
async def client():
    """Async client fixture for testing."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client

@pytest.fixture(autouse=True)
def mock_supabase():
    """Mocks out Supabase storage and db interactions."""
    with patch("pipeline.save_conversation", return_value="mock-uuid"), \
         patch("pipeline.save_audio_file", return_value="mock-audio-id"), \
         patch("pipeline.speech_to_text", return_value="hello"), \
         patch("pipeline.translate_text", return_value="hola"), \
         patch("pipeline.text_to_speech", return_value="outputs/mock.mp3"):
        yield
