"""Audio utility functions."""
import asyncio
import logging
import ffmpeg
from pathlib import Path

logger = logging.getLogger(__name__)

def _convert_to_wav_sync(input_path: str) -> str:
    """Synchronous implementation of convert_to_wav."""
    input_file = Path(input_path)
    output_file = input_file.with_suffix('.wav')
    
    try:
        (
            ffmpeg
            .input(str(input_file))
            .output(str(output_file), ac=1, ar='16000')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        return str(output_file)
    except ffmpeg.Error as e:
        error_message = e.stderr.decode('utf8') if e.stderr else str(e)
        logger.error("ffmpeg conversion failed: %s", error_message)
        raise ValueError(f"ffmpeg conversion failed: {error_message}")
    except FileNotFoundError:
        logger.error("ffmpeg executable not found.")
        raise ValueError("ffmpeg not found. Please ensure ffmpeg is installed and available in the system PATH.")

async def convert_to_wav(input_path: str) -> str:
    """
    Converts any audio format to 16kHz mono WAV using ffmpeg.
    
    Args:
        input_path: Path to the input audio file.
        
    Returns:
        Path to the converted WAV file.
        
    Raises:
        ValueError: If ffmpeg is not found or conversion fails.
    """
    return await asyncio.to_thread(_convert_to_wav_sync, input_path)
