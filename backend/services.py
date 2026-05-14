import whisper
from deep_translator import GoogleTranslator
from gtts import gTTS
from pydub import AudioSegment
import os
from config import config

model = None


def _get_model():
    global model
    if model is None:
        model = whisper.load_model(config.whisper_model)
    return model


def speech_to_text(input_path, source_lang="auto"):
    wav_path = input_path + ".wav"

    audio = AudioSegment.from_file(input_path)
    audio.export(wav_path, format="wav")

    transcribe_kwargs = {}
    if source_lang and source_lang != "auto":
        transcribe_kwargs["language"] = source_lang

    transcribe_kwargs["fp16"] = False
    result = _get_model().transcribe(wav_path, **transcribe_kwargs)

    os.remove(wav_path)

    return result["text"]


def translate_text(text, target_lang, source_lang="auto"):
    def normalize(code: str) -> str:
        normalized = (code or "").strip()
        if not normalized:
            return "auto"
        lowered = normalized.lower()
        aliases = {
            "zh-cn": "zh-CN",
            "zh-tw": "zh-TW",
            "jw": "jv",
        }
        return aliases.get(lowered, normalized)

    src = normalize(source_lang)
    tgt = normalize(target_lang)

    try:
        return GoogleTranslator(source=src, target=tgt).translate(text)
    except Exception:
        # Fallback path improves resilience for OCR content.
        return GoogleTranslator(source="auto", target=tgt).translate(text)


def text_to_speech(text, lang, filename):
    output_path = f"outputs/{filename}.mp3"
    # gTTS does not support every language code consistently in all regions.
    # Keep Punjabi direct first, then fall back gracefully.
    primary_lang = {"sa": "hi"}.get(lang, lang)
    fallback_chain = [primary_lang, "hi", "en"]
    last_error = None

    for tts_lang in fallback_chain:
        try:
            tts = gTTS(text=text, lang=tts_lang)
            tts.save(output_path)
            return output_path
        except Exception as e:
            last_error = e

    raise last_error if last_error else RuntimeError("Text-to-speech failed")
