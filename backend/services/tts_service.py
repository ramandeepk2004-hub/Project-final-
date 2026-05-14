import os
from gtts import gTTS


OUTPUTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")


def text_to_speech(text: str, lang: str, file_id: str) -> str:
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUTS_DIR, f"{file_id}.mp3")

    primary_lang = {"sa": "hi"}.get(lang, lang)
    fallback_chain = [primary_lang, "hi", "en"]
    last_error = None

    for tts_lang in fallback_chain:
        try:
            tts = gTTS(text=text, lang=tts_lang)
            tts.save(output_path)
            return output_path
        except Exception as error:
            last_error = error

    raise last_error if last_error else RuntimeError("Text-to-speech failed")
