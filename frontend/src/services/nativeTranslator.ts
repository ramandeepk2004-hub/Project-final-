import { registerPlugin } from '@capacitor/core';

export type ProcessResult = {
  original_text: string;
  translated_text: string;
  audio_url: string;
  source_language: string;
  target_language: string;
  processing_ms: number;
  extracted_text?: string;
};

type TranslateTextOptions = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

type OcrImageOptions = {
  base64Image: string;
  sourceLanguage: string;
  targetLanguage: string;
};

type SpeakTextOptions = {
  text: string;
  language: string;
};

export interface OmniTranslatorPlugin {
  translateText(options: TranslateTextOptions): Promise<ProcessResult>;
  ocrImage(options: OcrImageOptions): Promise<ProcessResult>;
  speakText(options: SpeakTextOptions): Promise<{ ok: boolean }>;
}

export const OmniTranslator = registerPlugin<OmniTranslatorPlugin>('OmniTranslator');
