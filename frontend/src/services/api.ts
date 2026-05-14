import axios, { AxiosError } from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: 45000,
});

export const resolveApiUrl = (path: string): string => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (apiBaseUrl) return `${apiBaseUrl}${path}`;
  return path;
};

export type ProcessResult = {
  original_text: string;
  translated_text: string;
  audio_url: string;
  source_language: string;
  target_language: string;
  processing_ms: number;
  extracted_text?: string;
};
export type UploadProgressCallback = (progress: number) => void;

const toError = (error: unknown): Error => {
  if (axios.isCancel(error)) {
    return new Error('Request cancelled', { cause: error });
  }

  const axiosError = error as AxiosError<{ detail?: string }>;

  if (axiosError.response?.status === 413) {
    return new Error('File too large', { cause: error });
  }
  if (axiosError.response?.status === 415) {
    return new Error('Unsupported format', { cause: error });
  }
  if (axiosError.response?.status === 503) {
    return new Error(axiosError.response?.data?.detail || 'Required server dependency is unavailable', { cause: error });
  }

  return new Error(axiosError.response?.data?.detail || 'Connection failed', { cause: error });
};

export const processAudio = async (
  audioBlob: Blob,
  targetLanguage: string,
  sourceLanguage: string,
  signal?: AbortSignal,
  filterProfanity?: boolean,
): Promise<ProcessResult> => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('target_language', targetLanguage);
  formData.append('source_language', sourceLanguage);
  if (filterProfanity) {
    formData.append('filter_profanity', 'true');
  }

  try {
    const response = await apiClient.post<ProcessResult>('/process-audio', formData, {
      signal,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw toError(error);
  }
};

export const processText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
  signal?: AbortSignal,
): Promise<ProcessResult> => {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('target_language', targetLanguage);
  formData.append('source_language', sourceLanguage);

  try {
    const response = await apiClient.post<ProcessResult>('/process-text', formData, {
      signal,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw toError(error);
  }
};

export const processImage = async (
  file: File,
  targetLanguage: string,
  sourceLanguage: string,
  onProgress?: UploadProgressCallback,
): Promise<ProcessResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_language', targetLanguage);
  formData.append('source_language', sourceLanguage);

  try {
    const response = await apiClient.post<ProcessResult>('/translate-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw toError(error);
  }
};

export const translatePdfFile = async (
  file: File,
  targetLanguage: string,
  sourceLanguage: string,
  onProgress?: UploadProgressCallback,
): Promise<ProcessResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_language', targetLanguage);
  formData.append('source_language', sourceLanguage);

  try {
    const response = await apiClient.post<ProcessResult>('/translate-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw toError(error);
  }
};

export const translateTextFile = async (
  file: File,
  targetLanguage: string,
  sourceLanguage: string,
  onProgress?: UploadProgressCallback,
): Promise<ProcessResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_language', targetLanguage);
  formData.append('source_language', sourceLanguage);

  try {
    const response = await apiClient.post<ProcessResult>('/translate-text-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw toError(error);
  }
};

export const fetchSuggestions = async (text: string): Promise<string[]> => {
  const formData = new FormData();
  formData.append('text', text);

  try {
    const response = await apiClient.post<{ suggestions: string[] }>('/phrase-suggestions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.suggestions || [];
  } catch (error: unknown) {
    throw toError(error);
  }
};

export const exportConversation = async (
  content: string,
  formatType: 'txt' | 'pdf',
  filename: string,
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('format_type', formatType);
  formData.append('filename', filename);

  try {
    const response = await apiClient.post('/export', formData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Blob;
  } catch (error: unknown) {
    throw toError(error);
  }
};

export type StreamingPayload = {
  partial_original?: string;
  partial_translation?: string;
  original_text?: string;
  translated_text?: string;
  audio_url?: string;
  is_final: boolean;
};

export const createStreamingSocket = () => {
  if (apiBaseUrl) {
    const wsBase = apiBaseUrl.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');
    return new WebSocket(`${wsBase}/ws/stream-translate`);
  }

  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return new WebSocket(`${proto}://${window.location.host}/ws/stream-translate`);
};

export const fetchSmartReplies = async (text: string, category = ''): Promise<{ category: string; replies: string[] }> => {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('category', category);
  const response = await apiClient.post('/ai/smart-replies', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as { category: string; replies: string[] };
};

export const generateConversationSummary = async (
  messages: Array<Record<string, unknown>>,
): Promise<{ summary: string; keywords: string[]; language_pairs: string[]; timestamps: string[]; message_count: number }> => {
  const response = await apiClient.post('/ai/summary', { messages });
  return response.data as { summary: string; keywords: string[]; language_pairs: string[]; timestamps: string[]; message_count: number };
};

export const exportSummary = async (
  content: string,
  formatType: 'txt' | 'pdf' | 'docx',
): Promise<Blob> => {
  const response = await apiClient.post(
    '/ai/summary/export',
    { content, format_type: formatType },
    { responseType: 'blob' },
  );
  return response.data as Blob;
};

export const evaluatePronunciation = async (
  audioBlob: Blob,
  expectedText: string,
  sourceLanguage: string,
): Promise<{ score: number; feedback: string[]; recognized_text: string; fluency: number; confidence: number; clarity: number }> => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'pronunciation.webm');
  formData.append('expected_text', expectedText);
  formData.append('source_language', sourceLanguage);
  const response = await apiClient.post('/ai/pronunciation', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as { score: number; feedback: string[]; recognized_text: string; fluency: number; confidence: number; clarity: number };
};

export const cameraTranslate = async (
  file: File,
  targetLanguage: string,
  sourceLanguage: string,
): Promise<{ original_text: string; translated_text: string; blocks: Array<{ text: string; translated: string; box: { x: number; y: number; w: number; h: number } }> }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_language', targetLanguage);
  formData.append('source_language', sourceLanguage);
  const response = await apiClient.post('/ai/camera-translate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as { original_text: string; translated_text: string; blocks: Array<{ text: string; translated: string; box: { x: number; y: number; w: number; h: number } }> };
};
