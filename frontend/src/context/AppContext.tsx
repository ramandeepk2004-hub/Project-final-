import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Action, ActiveView, AppSettings, AppState } from '../types';
import { defaultPhrasebook } from '../data/defaultPhrasebook';

const defaultSettings: AppSettings = {
  autoPlay: true,
  autoDetectSource: true,
  autoDetectSpeaker: true,
  playbackSpeed: 1,
  historyEnabled: true,
  continuousListening: false,
  autoScroll: true,
  allowVoiceStorage: false,
  filterProfanity: false,
  copyMode: 'translated',
  privateMode: false,
  theme: 'system',
  largeText: false,
  highContrast: false,
  subtitleMode: false,
  dyslexiaFont: false,
  animationsEnabled: true,
};

const routeToView = (pathname: string): ActiveView => {
  if (pathname === '/conversation') return 'conversation';
  return 'chat';
};

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('localStorage write failed', error);
  }
};

const loadPhrasebook = () => {
  try {
    const raw = localStorage.getItem('ag_phrasebook');
    if (!raw) return defaultPhrasebook;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultPhrasebook;
    }
    const existingIds = new Set(parsed.map((phrase) => phrase?.id).filter(Boolean));
    const missingDefaults = defaultPhrasebook.filter((phrase) => !existingIds.has(phrase.id));
    return [...parsed, ...missingDefaults];
  } catch {
    return defaultPhrasebook;
  }
};

const initialActiveView = routeToView(window.location.pathname);

const initialState: AppState = {
  messages: load('ag_history', []),
  savedItems: load('ag_saved', []),
  phrasebook: loadPhrasebook(),
  livePreviewText: '',
  liveTranscriptText: '',
  suggestions: [],
  recentLanguages: load('ag_recent_languages', ['hi', 'en', 'fr', 'es']),
  settings: { ...defaultSettings, ...load<Partial<AppSettings>>('ag_settings', {}) },
  activeView: initialActiveView,
  appMode: initialActiveView === 'conversation' ? 'conversation' : 'single',
  activeSpeaker: null,
  languageA: 'hi',
  languageB: 'en',
  recordingState: 'idle',
  audioPermission: 'unknown',
  currentlyPlayingId: null,
  error: null,
};

function appReducer(state: AppState, action: Action): AppState {
  const priv = state.settings.privateMode;

  switch (action.type) {
    case 'ADD_MESSAGE':
      if (!state.settings.historyEnabled && !priv) return state;
      return { ...state, messages: [...state.messages, action.payload] };

    case 'CLEAR_HISTORY':
      return { ...state, messages: [] };

    case 'SAVE_ITEM':
      if (priv) return state;
      if (state.savedItems.some((item) => item.id === action.payload.id)) return state;
      return { ...state, savedItems: [...state.savedItems, action.payload] };

    case 'REMOVE_SAVED_ITEM':
      return { ...state, savedItems: state.savedItems.filter((item) => item.id !== action.payload) };

    case 'ADD_PHRASE':
      if (priv) return state;
      if (state.phrasebook.some((phrase) => phrase.id === action.payload.id)) return state;
      return { ...state, phrasebook: [...state.phrasebook, action.payload] };

    case 'REMOVE_PHRASE':
      return { ...state, phrasebook: state.phrasebook.filter((phrase) => phrase.id !== action.payload) };

    case 'UPDATE_SETTING':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_ACTIVE_VIEW':
      return {
        ...state,
        activeView: action.payload,
        appMode: action.payload === 'conversation' ? 'conversation' : 'single',
        activeSpeaker: null,
        livePreviewText: '',
        liveTranscriptText: '',
      };

    case 'SET_APP_MODE':
      return { ...state, appMode: action.payload };

    case 'SET_ACTIVE_SPEAKER':
      return { ...state, activeSpeaker: action.payload };

    case 'SET_LANGUAGE_A':
      return { ...state, languageA: action.payload };

    case 'SET_LANGUAGE_B':
      return { ...state, languageB: action.payload };

    case 'PUSH_RECENT_LANGUAGE': {
      const next = [action.payload, ...state.recentLanguages.filter((code) => code !== action.payload)].slice(0, 6);
      return { ...state, recentLanguages: next };
    }

    case 'SWAP_LANGUAGES':
      return { ...state, languageA: state.languageB, languageB: state.languageA };

    case 'SET_LIVE_PREVIEW':
      return { ...state, livePreviewText: action.payload };

    case 'SET_LIVE_TRANSCRIPT':
      return { ...state, liveTranscriptText: action.payload };

    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };

    case 'SET_RECORDING_STATE':
      return { ...state, recordingState: action.payload };

    case 'SET_AUDIO_PERMISSION':
      return { ...state, audioPermission: action.payload };

    case 'SET_PLAYING_ID':
      return { ...state, currentlyPlayingId: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const expectedPath = state.activeView === 'conversation' ? '/conversation' : '/';
    if (window.location.pathname !== expectedPath) {
      window.history.pushState({}, '', expectedPath);
    }
  }, [state.activeView]);

  useEffect(() => {
    const onPopState = () => {
      dispatch({ type: 'SET_ACTIVE_VIEW', payload: routeToView(window.location.pathname) });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!state.settings.privateMode) {
      save('ag_history', state.messages);
    }
  }, [state.messages, state.settings.privateMode]);

  useEffect(() => {
    save('ag_saved', state.savedItems);
  }, [state.savedItems]);

  useEffect(() => {
    save('ag_phrasebook', state.phrasebook);
  }, [state.phrasebook]);

  useEffect(() => {
    save('ag_settings', state.settings);
  }, [state.settings]);

  useEffect(() => {
    save('ag_recent_languages', state.recentLanguages);
  }, [state.recentLanguages]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      const fallbackTheme = state.settings.theme === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', fallbackTheme);
      document.documentElement.dataset.fontScale = state.settings.largeText ? 'large' : 'normal';
      document.documentElement.dataset.contrast = state.settings.highContrast ? 'high' : 'normal';
      document.documentElement.dataset.subtitle = state.settings.subtitleMode ? 'on' : 'off';
      document.documentElement.dataset.readingFont = state.settings.dyslexiaFont ? 'dyslexia' : 'default';
      document.documentElement.dataset.motion = state.settings.animationsEnabled ? 'full' : 'reduced';
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolvedTheme =
        state.settings.theme === 'system'
          ? (mediaQuery.matches ? 'dark' : 'light')
          : state.settings.theme;

      document.documentElement.setAttribute('data-theme', resolvedTheme);
      document.documentElement.dataset.fontScale = state.settings.largeText ? 'large' : 'normal';
      document.documentElement.dataset.contrast = state.settings.highContrast ? 'high' : 'normal';
      document.documentElement.dataset.subtitle = state.settings.subtitleMode ? 'on' : 'off';
      document.documentElement.dataset.readingFont = state.settings.dyslexiaFont ? 'dyslexia' : 'default';
      document.documentElement.dataset.motion = state.settings.animationsEnabled ? 'full' : 'reduced';
    };

    applyTheme();

    if (state.settings.theme !== 'system') {
      return;
    }

    const handleChange = () => applyTheme();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [
    state.settings.theme,
    state.settings.largeText,
    state.settings.highContrast,
    state.settings.subtitleMode,
    state.settings.dyslexiaFont,
    state.settings.animationsEnabled,
  ]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
