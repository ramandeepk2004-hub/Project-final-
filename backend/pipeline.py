import uuid
import os
from time import perf_counter
from services.speech_service import speech_to_text
from services.translator_service import translate_text
from services.tts_service import text_to_speech
from database import save_conversation, save_audio_file


def process_pipeline(input_path, target_lang, source_lang="auto"):
    started = perf_counter()

    file_id = str(uuid.uuid4())

    try:
        original = speech_to_text(input_path, source_lang)
        print("STT:", original)
    except Exception as e:
        print("STT FAILED:", e)
        original = "Error in speech recognition"

    try:
        translated = translate_text(original, target_lang, source_lang)
        print("TRANSLATED:", translated)
    except Exception as e:
        print("TRANSLATION FAILED:", e)
        translated = "Translation failed"

    audio_url = ""
    try:
        text_to_speech(translated, target_lang, file_id)
        print("TTS DONE")
        audio_url = f"/audio/{file_id}.mp3"
    except Exception as e:
        print("TTS FAILED:", e)
    
    try:
        conv_id = save_conversation(original, translated, source_lang, target_lang, 0)
        if conv_id:
            save_audio_file(conv_id, None, audio_url)
    except Exception as e:
        print("DB SAVE FAILED:", e)

    processing_ms = int((perf_counter() - started) * 1000)

    return {
        "original_text": original,
        "translated_text": translated,
        "audio_url": audio_url,
        "source_language": source_lang,
        "target_language": target_lang,
        "processing_ms": processing_ms,
    }
