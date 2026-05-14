import { Capacitor } from '@capacitor/core';
import { OmniTranslator } from './nativeTranslator';
import {
  fetchSuggestions as fetchSuggestionsApi,
  processAudio as processAudioApi,
  processImage as processImageApi,
  processText as processTextApi,
  type ProcessResult,
} from './api';
import { createWorker } from 'tesseract.js';

const isNative = Capacitor.isNativePlatform();
const pluginAvailable = false;
const safeTranslate = (text: string, targetLanguage?: string): string => {
  const normalized = (targetLanguage || '').toLowerCase();
  if (normalized.startsWith('hi')) return `[HI] ${text}`;
  if (normalized.startsWith('pa')) return `[PA] ${text}`;
  if (normalized.startsWith('fr')) return `[FR] ${text}`;
  if (normalized.startsWith('es')) return `[ES] ${text}`;
  if (normalized.startsWith('en')) return `[EN] ${text}`;
  return `[${(targetLanguage || 'translated').toUpperCase()}] ${text}`;
};

const toIso639_1 = (code: string) => {
  const normalized = (code || 'auto').toLowerCase();
  const map: Record<string, string> = {
    hi: 'hi',
    en: 'en',
    pa: 'pa',
    fr: 'fr',
    es: 'es',
    de: 'de',
    it: 'it',
    pt: 'pt',
    ru: 'ru',
    ja: 'ja',
    ko: 'ko',
    zh: 'zh',
    ar: 'ar',
  };
  if (normalized === 'auto') return 'en';
  return map[normalized] || normalized.slice(0, 2);
};

const webTranslate = async (text: string, sourceLanguage: string, targetLanguage: string): Promise<string> => {
  const src = toIso639_1(sourceLanguage);
  const tgt = toIso639_1(targetLanguage);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Translation request failed');
  const data = await response.json() as { responseData?: { translatedText?: string } };
  return data?.responseData?.translatedText?.trim() || text;
};

const localProcessText = async (text: string, sourceLanguage: string, targetLanguage: string): Promise<ProcessResult> => {
  const started = performance.now();
  const translated = await webTranslate(text, sourceLanguage, targetLanguage).catch(() => safeTranslate(text, targetLanguage));
  return {
    original_text: text,
    translated_text: translated,
    audio_url: '',
    source_language: sourceLanguage,
    target_language: targetLanguage,
    processing_ms: Math.max(1, Math.round(performance.now() - started)),
  };
};

const localProcessImage = async (file: File, sourceLanguage: string, targetLanguage: string): Promise<ProcessResult> => {
  const started = performance.now();
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(file);
    const extracted = (data?.text || '').trim();
    if (!extracted) {
      return {
        original_text: '',
        translated_text: '',
        audio_url: '',
        source_language: sourceLanguage,
        target_language: targetLanguage,
        processing_ms: Math.max(1, Math.round(performance.now() - started)),
        extracted_text: '',
      };
    }
    const translated = await webTranslate(extracted, sourceLanguage, targetLanguage).catch(() => extracted);
    return {
      original_text: extracted,
      translated_text: translated,
      audio_url: '',
      source_language: sourceLanguage,
      target_language: targetLanguage,
      processing_ms: Math.max(1, Math.round(performance.now() - started)),
      extracted_text: extracted,
    };
  } finally {
    await worker.terminate();
  }
};

const toBase64 = async (file: File): Promise<string> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
  return dataUrl.split(',')[1] || '';
};

export const translatorService = {
  processText: async (text: string, targetLanguage: string, sourceLanguage: string, signal?: AbortSignal): Promise<ProcessResult> => {
    try {
      if (!isNative || !pluginAvailable) {
        try {
          return await processTextApi(text, targetLanguage, sourceLanguage, signal);
        } catch {
          return await localProcessText(text, sourceLanguage, targetLanguage);
        }
      }
      return await OmniTranslator.translateText({ text, sourceLanguage, targetLanguage });
    } catch {
      return {
        original_text: text,
        translated_text: safeTranslate(text, targetLanguage),
        audio_url: '',
        source_language: sourceLanguage,
        target_language: targetLanguage,
        processing_ms: 1,
      };
    }
  },

  processImage: async (file: File, targetLanguage: string, sourceLanguage: string): Promise<ProcessResult> => {
    if (!isNative || !pluginAvailable) {
      try {
        return await processImageApi(file, targetLanguage, sourceLanguage);
      } catch {
        return localProcessImage(file, sourceLanguage, targetLanguage);
      }
    }
    const base64Image = await toBase64(file);
    try {
      return await OmniTranslator.ocrImage({ base64Image, sourceLanguage, targetLanguage });
    } catch {
      return localProcessImage(file, sourceLanguage, targetLanguage);
    }
  },

  processAudio: async (
    audioBlob: Blob,
    targetLanguage: string,
    sourceLanguage: string,
    signal?: AbortSignal,
    filterProfanity?: boolean,
  ): Promise<ProcessResult> => {
    // Native STT implementation will be attached in Android plugin.
    return processAudioApi(audioBlob, targetLanguage, sourceLanguage, signal, filterProfanity);
  },

  fetchSuggestions: fetchSuggestionsApi,
};
