import logging
import json
import urllib.request
import urllib.error
from config import config

logger = logging.getLogger(__name__)

SUPABASE_URL = config.supabase_url
HEADERS = {
    "apikey": config.supabase_service_role_key,
    "Authorization": f"Bearer {config.supabase_service_role_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def save_conversation(original_text: str, translated_text: str, source_language: str, target_language: str, processing_ms: int):
    """
    Save a translation conversation to the Supabase database using REST.
    Returns the generated conversation ID.
    """
    url = f"{SUPABASE_URL}/rest/v1/conversations"
    data = {
        "original_text": original_text,
        "translated_text": translated_text,
        "source_language": source_language,
        "target_language": target_language,
        "processing_ms": processing_ms
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            if result and len(result) > 0:
                return result[0].get("id")
    except urllib.error.URLError as e:
        logger.error(f"Failed to save conversation to database: {e}")
    return None

def save_audio_file(conversation_id: str, input_audio_url: str = None, output_audio_url: str = None):
    """
    Save references to the generated audio files for a conversation using REST.
    """
    if not conversation_id:
        return None
        
    url = f"{SUPABASE_URL}/rest/v1/audio_files"
    data = {
        "conversation_id": conversation_id,
        "input_audio_url": input_audio_url,
        "output_audio_url": output_audio_url
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            if result and len(result) > 0:
                return result[0].get("id")
    except urllib.error.URLError as e:
        logger.error(f"Failed to save audio file references to database: {e}")
    return None
