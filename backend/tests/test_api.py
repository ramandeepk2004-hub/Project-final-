"""API tests."""
import pytest
from config import config

pytestmark = pytest.mark.anyio

@pytest.fixture
def anyio_backend():
    """Use asyncio backend for anyio."""
    return 'asyncio'

async def test_health(client):
    """Test health endpoint returns 200 and correct status."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "uptime_s" in response.json()

async def test_languages(client):
    """Test languages endpoint returns list with required items."""
    response = await client.get("/languages")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    for item in data:
        assert "code" in item
        assert "name" in item

async def test_process_missing_file(client):
    """Test process endpoint with missing file."""
    response = await client.post("/process", data={"target_language": "es"})
    assert response.status_code == 422

async def test_process_oversized_file(client):
    """Test process endpoint with oversized file."""
    # Create fake large file based on configured max size
    oversized_data = b"0" * ((config.max_upload_size_mb + 1) * 1024 * 1024)
    file_upload = {"file": ("large.wav", oversized_data, "audio/wav")}
    response = await client.post("/process", data={"target_language": "es"}, files=file_upload)
    assert response.status_code == 413
    assert "exceeds maximum allowed size" in response.json()["detail"]

async def test_process_invalid_mime_type(client):
    """Test process endpoint with invalid MIME type."""
    file_upload = {"file": ("test.txt", b"Hello", "text/plain")}
    response = await client.post("/process", data={"target_language": "es"}, files=file_upload)
    assert response.status_code == 415
    assert response.json()["detail"] == "Unsupported media type"


async def test_phrasebook_crud(client):
    create_payload = {
        "originalText": "Where is the station?",
        "translatedText": "Donde esta la estacion?",
        "category": "Travel",
        "languagePair": "EN-ES",
    }
    created = await client.post("/phrases", json=create_payload)
    assert created.status_code == 200
    phrase_id = created.json()["id"]

    listed = await client.get("/phrases")
    assert listed.status_code == 200
    assert any(int(item["id"]) == int(phrase_id) for item in listed.json())

    deleted = await client.delete(f"/phrases/{phrase_id}")
    assert deleted.status_code == 200
