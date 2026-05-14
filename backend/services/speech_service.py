import os
import whisper
from pydub import AudioSegment
from config import config

model = whisper.load_model(config.whisper_model)


def speech_to_text(input_path: str, source_lang: str = "auto") -> str:
    wav_path = input_path + ".wav"
    audio = AudioSegment.from_file(input_path)
    audio.export(wav_path, format="wav")

    transcribe_kwargs = {"fp16": False}
    if source_lang and source_lang != "auto":
      transcribe_kwargs["language"] = source_lang

    result = model.transcribe(wav_path, **transcribe_kwargs)

    if os.path.exists(wav_path):
      os.remove(wav_path)

    return result["text"]
