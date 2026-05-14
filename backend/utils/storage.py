"""Storage utility functions for interacting with Supabase."""
import asyncio
import logging
from supabase import create_client, Client
from config import config

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(config.supabase_url, config.supabase_service_role_key)

def _upload_audio_sync(local_path: str, bucket: str, dest_name: str) -> str:
    with open(local_path, 'rb') as f:
        supabase.storage.from_(bucket).upload(file=f, path=dest_name, file_options={"content-type": "audio/mpeg"})
    return supabase.storage.from_(bucket).get_public_url(dest_name)

async def upload_audio(local_path: str, bucket: str, dest_name: str) -> str:
    """
    Uploads file to Supabase storage bucket and returns the public URL.
    
    Args:
        local_path: Local path to the file to upload.
        bucket: Name of the Supabase storage bucket.
        dest_name: Destination filename in the bucket.
        
    Returns:
        The public URL of the uploaded file.
    """
    return await asyncio.to_thread(_upload_audio_sync, local_path, bucket, dest_name)

def _log_conversation_sync(original_text: str, translated_text: str, source_lang: str,
                           target_lang: str, processing_ms: int, input_url: str, output_url: str) -> str:
    conv_data = {
        "original_text": original_text,
        "translated_text": translated_text,
        "source_language": source_lang,
        "target_language": target_lang,
        "processing_ms": processing_ms
    }
    conv_res = supabase.table("conversations").insert(conv_data).execute()
    conversation_id = conv_res.data[0]['id']
    
    audio_data = {
        "conversation_id": conversation_id,
        "input_audio_url": input_url,
        "output_audio_url": output_url
    }
    supabase.table("audio_files").insert(audio_data).execute()
    
    return conversation_id

async def log_conversation(original_text: str, translated_text: str, source_lang: str,
                           target_lang: str, processing_ms: int, input_url: str, output_url: str) -> str:
    """
    Inserts a record into the conversations and audio_files tables.
    
    Args:
        original_text: Original transcribed text.
        translated_text: Translated text.
        source_lang: Source language code.
        target_lang: Target language code.
        processing_ms: Processing time in milliseconds.
        input_url: URL of the input audio.
        output_url: URL of the output audio.
        
    Returns:
        The ID of the inserted conversation.
    """
    return await asyncio.to_thread(_log_conversation_sync, original_text, translated_text, source_lang, target_lang, processing_ms, input_url, output_url)
