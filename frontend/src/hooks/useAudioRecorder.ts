import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

type StartRecordingOptions = {
  languageCode?: string;
  onResult?: (text: string) => void;
  onSilence?: () => void;
};

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceIntervalRef = useRef<number | null>(null);
  const lastSpeechAtRef = useRef<number>(Date.now());

  const clearMonitors = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (silenceIntervalRef.current) {
      window.clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
  };

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No recording active'));
        return;
      }

      clearMonitors();

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => undefined);
          audioCtxRef.current = null;
          analyserRef.current = null;
        }

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // Ignore stop errors from already-stopped recognizer.
          }
          recognitionRef.current = null;
        }

        mediaRecorderRef.current = null;

        if (audioBlob.size < 1000) {
          reject(new Error('empty_recording'));
        } else {
          resolve(audioBlob);
        }
      };

      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    });
  }, []);

  const startRecording = useCallback(async ({
    languageCode,
    onResult,
    onSilence,
  }: StartRecordingOptions = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermission('granted');
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000,
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      lastSpeechAtRef.current = Date.now();

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      silenceIntervalRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(frequencyData);
        const average = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
        if (average > 20) {
          lastSpeechAtRef.current = Date.now();
        }
        if (onSilence && Date.now() - lastSpeechAtRef.current > 2200) {
          window.clearInterval(silenceIntervalRef.current ?? undefined);
          silenceIntervalRef.current = null;
          onSilence();
        }
      }, 200);

      const shouldUseWebSpeechRecognition = !Capacitor.isNativePlatform();
      const speechWindow = window as SpeechWindow;
      const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
      if (shouldUseWebSpeechRecognition && SpeechRecognition && onResult) {
        const localeMap: Record<string, string> = {
          en: 'en-US',
          hi: 'hi-IN',
          pa: 'pa-IN',
          sa: 'hi-IN',
          bn: 'bn-IN',
          ta: 'ta-IN',
          te: 'te-IN',
          mr: 'mr-IN',
          es: 'es-ES',
          fr: 'fr-FR',
          de: 'de-DE',
          ar: 'ar-SA',
          ja: 'ja-JP',
          ko: 'ko-KR',
          zh: 'zh-CN',
        };
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        if (languageCode) {
          recognition.lang = localeMap[languageCode] || languageCode;
        }

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            lastSpeechAtRef.current = Date.now();
            onResult(transcript);
          }
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (error) {
          console.warn('SpeechRecognition start failed', error);
        }
      }

      timeoutRef.current = window.setTimeout(() => {
        void stopRecording();
        toast('Maximum recording time reached (15s)', { icon: '⏱️' });
      }, 15000);
    } catch (error) {
      console.error('Error accessing microphone', error);
      setAudioPermission('denied');
      toast.error('Microphone access denied');
    }
  }, [stopRecording]);

  return {
    isRecording,
    audioPermission,
    startRecording,
    stopRecording,
    analyserNode: analyserRef,
  };
};
