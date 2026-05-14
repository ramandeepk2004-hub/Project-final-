from deep_translator import GoogleTranslator


def normalize_lang(code: str, default: str = "auto") -> str:
    normalized = (code or "").strip()
    if not normalized:
        return default
    lowered = normalized.lower()
    aliases = {
        "zh-cn": "zh-CN",
        "zh-tw": "zh-TW",
        "jw": "jv",
    }
    return aliases.get(lowered, normalized)


def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> str:
    src = normalize_lang(source_lang, "auto")
    tgt = normalize_lang(target_lang, "en")
    if not text.strip():
        return ""

    try:
        return GoogleTranslator(source=src, target=tgt).translate(text)
    except Exception:
        return GoogleTranslator(source="auto", target=tgt).translate(text)


def get_supported_languages() -> list[dict[str, str]]:
    langs_dict = GoogleTranslator().get_supported_languages(as_dict=True)
    return [{"code": code, "name": name.title()} for name, code in langs_dict.items()]
