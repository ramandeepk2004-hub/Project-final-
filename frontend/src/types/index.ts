export interface Message {
  id: string;
  originalText: string;
  translatedText: string;
  audioUrl: string;
  sourceLanguage: string;
  targetLanguage: string;
  processingMs: number;
  timestamp: Date;
  mode: 'chat' | 'conversation' | 'image';
  speaker?: 'A' | 'B';
  extractedText?: string;
  previewUrl?: string;
}

export interface Phrase {
  id: string;
  originalText: string;
  translatedText: string;
  category:
    | 'general'
    | 'travel'
    | 'emergency'
    | 'medical'
    | 'food'
    | 'shopping'
    | 'business'
    | 'hotel'
    | 'transportation'
    | 'custom';
  languagePair: string;
  createdAt: Date;
}

export interface SavedItem {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  savedAt: Date;
}

export interface AppSettings {
  autoPlay: boolean;
  autoDetectSource: boolean;
  autoDetectSpeaker: boolean;
  playbackSpeed: 0.75 | 1 | 1.25;
  historyEnabled: boolean;
  continuousListening: boolean;
  autoScroll: boolean;
  allowVoiceStorage: boolean;
  filterProfanity: boolean;
  copyMode: 'translated' | 'both';
  privateMode: boolean;
  theme: 'dark' | 'light' | 'system';
  largeText: boolean;
  highContrast: boolean;
  subtitleMode: boolean;
  dyslexiaFont: boolean;
  animationsEnabled: boolean;
}

export type ActiveView =
  | 'chat'
  | 'conversation'
  | 'phrasebook'
  | 'analytics'
  | 'history'
  | 'settings';

export interface AppState {
  messages: Message[];
  savedItems: SavedItem[];
  phrasebook: Phrase[];
  livePreviewText: string;
  liveTranscriptText: string;
  suggestions: string[];
  recentLanguages: string[];
  settings: AppSettings;
  activeView: ActiveView;
  appMode: 'single' | 'conversation';
  activeSpeaker: 'A' | 'B' | null;
  languageA: string;
  languageB: string;
  recordingState: 'idle' | 'recording' | 'processing';
  audioPermission: 'unknown' | 'granted' | 'denied';
  currentlyPlayingId: string | null;
  error: { type: string; message: string } | null;
}

export type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SAVE_ITEM'; payload: SavedItem }
  | { type: 'REMOVE_SAVED_ITEM'; payload: string }
  | { type: 'ADD_PHRASE'; payload: Phrase }
  | { type: 'REMOVE_PHRASE'; payload: string }
  | { type: 'UPDATE_SETTING'; payload: Partial<AppSettings> }
  | { type: 'SET_ACTIVE_VIEW'; payload: ActiveView }
  | { type: 'SET_APP_MODE'; payload: AppState['appMode'] }
  | { type: 'SET_ACTIVE_SPEAKER'; payload: AppState['activeSpeaker'] }
  | { type: 'SET_LANGUAGE_A'; payload: string }
  | { type: 'SET_LANGUAGE_B'; payload: string }
  | { type: 'PUSH_RECENT_LANGUAGE'; payload: string }
  | { type: 'SWAP_LANGUAGES' }
  | { type: 'SET_LIVE_PREVIEW'; payload: string }
  | { type: 'SET_LIVE_TRANSCRIPT'; payload: string }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'SET_RECORDING_STATE'; payload: AppState['recordingState'] }
  | { type: 'SET_AUDIO_PERMISSION'; payload: AppState['audioPermission'] }
  | { type: 'SET_PLAYING_ID'; payload: string | null }
  | { type: 'SET_ERROR'; payload: { type: string; message: string } | null };
