import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeftRight, Image as ImageIcon, Loader2, Mic } from 'lucide-react';
import { RecordButton } from './RecordButton';
import { StatusIndicator } from './StatusIndicator';
import { ErrorBanner } from './ErrorBanner';
import { WaveformVisualizer } from './WaveformVisualizer';
import { SuggestionsStrip } from './SuggestionsStrip';
import { LanguageSelector } from './LanguageSelector';
import { useAppContext } from '../context/AppContext';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { resolveApiUrl, type ProcessResult } from '../services/api';
import { translatorService } from '../services/translatorService';
export const ControlPanel: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { startRecording, stopRecording, analyserNode } = useAudioRecorder();
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSpeakerRef = useRef<'A' | 'B'>('A');
  const handleStopRef = useRef<(fromSilence?: boolean) => Promise<void>>(async () => undefined);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [typedText, setTypedText] = useState('');
  const makeMessageId = useCallback(() => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch {
      // Fallback for older Android WebView implementations
    }
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }, []);
  const isBusy = state.recordingState !== 'idle';
  const isChatMode = state.activeView !== 'conversation';
  const isChatRecording = isChatMode && state.recordingState === 'recording';
  const isChatProcessing = isChatMode && state.recordingState === 'processing';

  const getSourceLanguage = useCallback(
    (speaker: 'A' | 'B' | null) => {
      if (state.settings.autoDetectSource) {
        return 'auto';
      }
      return speaker === 'B' ? state.languageB : state.languageA;
    },
    [state.settings.autoDetectSource, state.languageA, state.languageB],
  );

  const getTargetLanguage = useCallback(
    (speaker: 'A' | 'B' | null) => {
      return state.activeView === 'conversation' && speaker === 'B' ? state.languageA : state.languageB;
    },
    [state.activeView, state.languageA, state.languageB],
  );

  const refreshSuggestions = useCallback(async (translatedText: string) => {
    try {
      const suggestions = await translatorService.fetchSuggestions(translatedText);
      dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } catch {
      dispatch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [dispatch]);

  useEffect(() => {
    if (state.recordingState !== 'recording') {
      dispatch({ type: 'SET_LIVE_TRANSCRIPT', payload: '' });
      return;
    }

    if (state.livePreviewText.trim()) {
      return;
    }

    dispatch({ type: 'SET_LIVE_TRANSCRIPT', payload: 'Listening...' });
    const hintTimer = window.setTimeout(() => {
      dispatch({ type: 'SET_LIVE_TRANSCRIPT', payload: 'Listening to speech...' });
    }, 900);

    return () => window.clearTimeout(hintTimer);
  }, [dispatch, state.livePreviewText, state.recordingState]);

  useEffect(() => {
    if (state.recordingState !== 'recording') {
      return;
    }

    const target = state.livePreviewText.trim();
    if (!target) {
      return;
    }

    let frame = 0;
    const step = Math.max(1, Math.floor(target.length / 28));
    const interval = window.setInterval(() => {
      frame += step;
      dispatch({
        type: 'SET_LIVE_TRANSCRIPT',
        payload: target.slice(0, Math.min(frame, target.length)),
      });

      if (frame >= target.length) {
        window.clearInterval(interval);
      }
    }, 45);

    return () => window.clearInterval(interval);
  }, [dispatch, state.livePreviewText, state.recordingState]);

  const finalizeResult = useCallback(async (
    result: ProcessResult,
    speaker: 'A' | 'B',
    mode: 'chat' | 'conversation' | 'image',
    previewUrl?: string,
  ) => {
    const newMsgId = makeMessageId();

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: newMsgId,
        originalText: result.original_text,
        translatedText: result.translated_text,
        audioUrl: result.audio_url ? resolveApiUrl(result.audio_url) : '',
        sourceLanguage: result.source_language,
        targetLanguage: result.target_language,
        processingMs: result.processing_ms,
        timestamp: new Date(),
        mode,
        speaker,
        extractedText: result.extracted_text,
        previewUrl,
      },
    });

    await refreshSuggestions(result.translated_text);

    if (result.audio_url && state.settings.autoPlay) {
      new Audio(resolveApiUrl(result.audio_url)).play().catch(() => undefined);
    }
  }, [dispatch, makeMessageId, refreshSuggestions, state.settings.autoPlay]);

  const handleStart = useCallback(async (speaker: 'A' | 'B') => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    dispatch({ type: 'SET_ACTIVE_SPEAKER', payload: speaker });
    dispatch({ type: 'SET_LIVE_PREVIEW', payload: '' });
    dispatch({ type: 'SET_LIVE_TRANSCRIPT', payload: 'Listening...' });
    lastSpeakerRef.current = speaker;
    dispatch({ type: 'SET_RECORDING_STATE', payload: 'recording' });

    const langCode = speaker === 'A' ? state.languageA : state.languageB;
    await startRecording({
      languageCode: langCode,
      onResult: (text) => {
        dispatch({ type: 'SET_LIVE_PREVIEW', payload: text });
      },
      onSilence: () => {
        if (state.activeView === 'conversation' && state.settings.autoDetectSpeaker) {
          void handleStopRef.current(true);
        }
      },
    });
  }, [dispatch, startRecording, state.activeView, state.languageA, state.languageB, state.settings.autoDetectSpeaker]);

  const handleStop = useCallback(async (fromSilence = false) => {
    dispatch({ type: 'SET_RECORDING_STATE', payload: 'processing' });
    const speaker = state.activeSpeaker || lastSpeakerRef.current || 'A';
    const previewText = state.livePreviewText.trim();

    try {
      let audioBlob: Blob | null = null;
      try {
        audioBlob = await stopRecording();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        if (message !== 'empty_recording') throw error;
      }

      abortControllerRef.current = new AbortController();

      let result: ProcessResult;
      if (previewText.length >= 3) {
        try {
          result = await translatorService.processText(previewText, getTargetLanguage(speaker), getSourceLanguage(speaker), abortControllerRef.current.signal);
        } catch {
          if (!audioBlob) {
            throw new Error('Connection failed');
          }
          result = await translatorService.processAudio(
            audioBlob,
            getTargetLanguage(speaker),
            getSourceLanguage(speaker),
            abortControllerRef.current.signal,
            state.settings.filterProfanity,
          );
        }
      } else {
        if (!audioBlob) throw new Error('empty_recording');
        result = await translatorService.processAudio(
          audioBlob,
          getTargetLanguage(speaker),
          getSourceLanguage(speaker),
          abortControllerRef.current.signal,
          state.settings.filterProfanity,
        );
      }

      const mode = state.activeView === 'conversation' ? 'conversation' : 'chat';
      await finalizeResult(result, speaker, mode);

      if (state.activeView === 'conversation' && state.settings.autoDetectSpeaker && fromSilence) {
        const nextSpeaker = speaker === 'A' ? 'B' : 'A';
        window.setTimeout(() => { void handleStart(nextSpeaker); }, 800);
      } else if (state.settings.continuousListening && state.activeView === 'chat') {
        window.setTimeout(() => { void handleStart(speaker); }, 1000);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Translation failed';
      if (message === 'empty_recording') {
        toast('Audio was too short', { icon: '??' });
      } else if (message !== 'Request cancelled') {
        toast.error(message || 'Translation failed');
      }
    } finally {
      dispatch({ type: 'SET_RECORDING_STATE', payload: 'idle' });
      dispatch({ type: 'SET_ACTIVE_SPEAKER', payload: null });
      dispatch({ type: 'SET_LIVE_PREVIEW', payload: '' });
      dispatch({ type: 'SET_LIVE_TRANSCRIPT', payload: '' });
      abortControllerRef.current = null;
    }
  }, [dispatch, finalizeResult, getSourceLanguage, getTargetLanguage, handleStart, state.activeSpeaker, state.activeView, state.livePreviewText, state.settings.autoDetectSpeaker, state.settings.continuousListening, state.settings.filterProfanity, stopRecording]);

  useEffect(() => {
    handleStopRef.current = handleStop;
  }, [handleStop]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const updatePanelHeight = () => {
      document.documentElement.style.setProperty('--control-panel-height', `${panel.offsetHeight}px`);
    };

    updatePanelHeight();

    const resizeObserver = new ResizeObserver(updatePanelHeight);
    resizeObserver.observe(panel);
    window.addEventListener('resize', updatePanelHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePanelHeight);
      document.documentElement.style.removeProperty('--control-panel-height');
    };
  }, []);

  const handleSendText = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? typedText).trim();
    if (!text || state.recordingState !== 'idle') return;

    dispatch({ type: 'SET_RECORDING_STATE', payload: 'processing' });
    const speaker: 'A' | 'B' = state.activeView === 'conversation' ? (state.activeSpeaker || 'A') : 'A';

    try {
      abortControllerRef.current = new AbortController();
      const result = await translatorService.processText(text, getTargetLanguage(speaker), getSourceLanguage(speaker), abortControllerRef.current.signal);
      await finalizeResult(result, speaker, state.activeView === 'conversation' ? 'conversation' : 'chat');
      setTypedText('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Translation failed';
      toast.error(message);
    } finally {
      dispatch({ type: 'SET_RECORDING_STATE', payload: 'idle' });
      abortControllerRef.current = null;
    }
  }, [dispatch, finalizeResult, getSourceLanguage, getTargetLanguage, state.activeSpeaker, state.activeView, state.recordingState, typedText]);
  const handleImageTranslate = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large (max 10MB)');
      return;
    }

    dispatch({ type: 'SET_RECORDING_STATE', payload: 'processing' });
    try {
      const speaker: 'A' | 'B' = state.activeView === 'conversation' ? (state.activeSpeaker || 'A') : 'A';
      const result = await translatorService.processImage(file, getTargetLanguage(speaker), getSourceLanguage(speaker));
      const extracted = (result.extracted_text || result.original_text || '').trim();
      if (!extracted) {
        toast.error('No text detected in image');
        return;
      }

      setTypedText(extracted);
      toast.success('Text extracted from image. Press Send to translate.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Image translation failed';
      toast.error(message);
    } finally {
      dispatch({ type: 'SET_RECORDING_STATE', payload: 'idle' });
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  }, [dispatch, getSourceLanguage, getTargetLanguage, state.activeSpeaker, state.activeView]);

  return (
    <div
      ref={panelRef}
      className="fixed left-0 z-40 w-full border-t border-white/5 bg-bg/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:left-72 md:w-[calc(100%-18rem)]"
      style={{ bottom: 'calc(var(--mobile-nav-height, 0px) + 8px)' }}
    >
      <div className="mx-auto max-w-6xl px-4 py-2 md:py-2">
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:hidden">
          <LanguageSelector type="A" currentValue={state.languageA} />
          <button
            onClick={() => dispatch({ type: 'SWAP_LANGUAGES' })}
            disabled={state.recordingState !== 'idle'}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-textSecondary disabled:opacity-50"
            aria-label="Swap languages"
          >
            <ArrowLeftRight size={16} />
          </button>
          <LanguageSelector type="B" currentValue={state.languageB} />
        </div>

        <StatusIndicator />
        <WaveformVisualizer analyserNode={analyserNode} isActive={state.recordingState === 'recording'} />

        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            onClick={() => dispatch({ type: 'UPDATE_SETTING', payload: { autoDetectSource: !state.settings.autoDetectSource } })}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${state.settings.autoDetectSource ? 'border-primary/30 bg-primary/20 text-primary' : 'border-white/10 bg-white/5 text-textSecondary'}`}
          >
            Auto Detect: {state.settings.autoDetectSource ? 'On' : 'Off'}
          </button>
          <div className="text-right text-[11px] text-textSecondary">
            {state.activeView === 'conversation'
              ? `Speaker A: ${state.languageA.toUpperCase()} · Speaker B: ${state.languageB.toUpperCase()}`
              : `Source: ${state.settings.autoDetectSource ? 'Auto' : state.languageA.toUpperCase()} ? Target: ${state.languageB.toUpperCase()}`}
          </div>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleImageTranslate(file);
            }
          }}
        />

        <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSendText();
              }
            }}
            placeholder={state.activeView === 'conversation' ? 'Type a line for the active speaker...' : 'Type here and press Enter...'}
            className="h-11 w-full flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-textPrimary placeholder:text-textSecondary focus:border-primary/50 focus:outline-none"
            disabled={isBusy}
          />
          <div className="grid w-full grid-cols-[1fr_1fr_auto] gap-2 sm:flex sm:w-auto sm:grid-cols-none">
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={isBusy}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-textSecondary transition-colors hover:border-primary/40 hover:text-white disabled:opacity-50"
            >
              <ImageIcon size={14} />
              Image
            </button>
            <button
              onClick={() => void handleSendText()}
              disabled={isBusy || typedText.trim().length === 0}
              className="h-11 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              Send
            </button>
            {isChatMode && (
              <button
                onClick={() => {
                  if (state.recordingState === 'idle') {
                    void handleStart('A');
                  } else if (state.recordingState === 'recording') {
                    void handleStop();
                  }
                }}
                disabled={isChatProcessing}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                  isChatRecording
                    ? 'border-red-400/60 bg-red-500 text-white'
                    : 'border-white/10 bg-primary text-white hover:bg-primary/90'
                } ${isChatProcessing ? 'cursor-not-allowed opacity-60' : ''}`}
                aria-label={isChatRecording ? 'Stop recording' : 'Start recording'}
              >
                {isChatProcessing ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
              </button>
            )}
          </div>
        </div>

        <SuggestionsStrip onUseSuggestion={(text) => void handleSendText(text)} />

        {state.activeView === 'conversation' && (
          <div className="mt-1.5 flex items-center justify-center gap-5">
            <>
              <RecordButton onStart={() => void handleStart('A')} onStop={() => void handleStop()} isActiveSpeaker={state.activeSpeaker === 'A'} label={`Speaker A (${state.languageA.toUpperCase()})`} />
              <div className="hidden h-16 w-px bg-white/10 sm:block" />
              <RecordButton onStart={() => void handleStart('B')} onStop={() => void handleStop()} isActiveSpeaker={state.activeSpeaker === 'B'} label={`Speaker B (${state.languageB.toUpperCase()})`} />
            </>
          </div>
        )}

        <ErrorBanner />
      </div>
    </div>
  );
};








