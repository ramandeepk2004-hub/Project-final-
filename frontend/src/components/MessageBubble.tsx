import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Bookmark, Check, Share2, Download, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Message } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { useAppContext } from '../context/AppContext';

const langNames: Record<string, { name: string; flag: string }> = {
  hi: { name: 'Hindi', flag: '🇮🇳' },
  pa: { name: 'Punjabi', flag: '🇮🇳' },
  sa: { name: 'Sanskrit', flag: '🇮🇳' },
  ta: { name: 'Tamil', flag: '🇮🇳' },
  te: { name: 'Telugu', flag: '🇮🇳' },
  bn: { name: 'Bengali', flag: '🇮🇳' },
  mr: { name: 'Marathi', flag: '🇮🇳' },
  en: { name: 'English', flag: '🇬🇧' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  de: { name: 'German', flag: '🇩🇪' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
};

const getLangDisplay = (code: string) => {
  const info = langNames[code];
  return info ? `${info.name} ${info.flag}` : code.toUpperCase();
};

export const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const { state, dispatch } = useAppContext();
  const [copied, setCopied] = React.useState(false);
  const isConvo = message.mode === 'conversation';
  const isSpeakerB = message.speaker === 'B';

  const align = isConvo && isSpeakerB ? 'items-end' : 'items-start';
  const self = isConvo && isSpeakerB ? 'self-end' : 'self-start';
  const origBg = isConvo && isSpeakerB ? 'bg-secondary/10' : 'bg-surface';
  const transBg = isConvo && isSpeakerB ? 'bg-secondary/20 border-secondary/30' : 'bg-primary/10 border-primary/20';
  const dot = isConvo && isSpeakerB ? 'bg-secondary' : 'bg-primary';
  const corner1 = isConvo && isSpeakerB ? 'rounded-tr-sm' : 'rounded-tl-sm';
  const corner2 = isConvo && isSpeakerB ? 'rounded-br-sm' : 'rounded-bl-sm';

  const handleCopy = () => {
    const text =
      state.settings.copyMode === 'translated'
        ? message.translatedText
        : `${message.originalText} -> ${message.translatedText}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    const text = `${message.originalText} -> ${message.translatedText}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    }
  };

  const handleDownload = () => {
    if (!message.audioUrl) return;
    const a = document.createElement('a');
    a.href = message.audioUrl;
    a.download = `translation_${message.id.slice(0, 8)}.mp3`;
    a.click();
    toast.success('Downloading audio');
  };

  const handleSaveToPhrasebook = () => {
    dispatch({
      type: 'ADD_PHRASE',
      payload: {
        id: makeId(),
        originalText: message.originalText,
        translatedText: message.translatedText,
        category: 'general',
        languagePair: `${message.sourceLanguage}-${message.targetLanguage}`,
        createdAt: new Date(),
      },
    });
    toast.success('Saved to Phrasebook');
  };

  const isSaved = state.savedItems.some((i) => i.id === message.id);

  const handleBookmark = () => {
    if (isSaved) {
      dispatch({ type: 'REMOVE_SAVED_ITEM', payload: message.id });
      toast('Removed from saved', { icon: '🗑️' });
    } else {
      dispatch({
        type: 'SAVE_ITEM',
        payload: {
          id: message.id,
          originalText: message.originalText,
          translatedText: message.translatedText,
          sourceLanguage: message.sourceLanguage,
          targetLanguage: message.targetLanguage,
          savedAt: new Date(),
        },
      });
      toast.success('Bookmarked!');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col gap-2 mb-6 w-full ${align}`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${self}`}>
        <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-textSecondary mb-1">
          Detected: {getLangDisplay(message.sourceLanguage)}
        </span>
      </div>

      <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${align} ${self}`}>
        <div className={`glass-panel px-4 py-3 rounded-2xl ${origBg} ${corner1}`}>
          <p className="text-sm md:text-base text-textPrimary leading-relaxed">{message.originalText}</p>
        </div>
      </div>

      <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${align} ${self}`}>
        <span className="text-xs text-textSecondary mb-1 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {getLangDisplay(message.targetLanguage)}
          <span className="opacity-50 ml-1">⚡ {(message.processingMs / 1000).toFixed(1)}s</span>
        </span>

        <div className={`glass-panel px-4 py-3 rounded-2xl flex flex-col gap-2 ${transBg} ${corner2}`}>
          {message.previewUrl && (
            <img
              src={message.previewUrl}
              alt="Uploaded translation source"
              className="max-h-48 w-full rounded-xl object-cover"
            />
          )}
          {message.extractedText && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-textSecondary">Extracted text</p>
              <p className="text-sm text-textSecondary">{message.extractedText}</p>
            </div>
          )}
          <p className="text-sm md:text-base text-textPrimary leading-relaxed font-medium">{message.translatedText}</p>

          <div className="border-t border-white/5 pt-2 flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-0.5">
              <ActionBtn onClick={handleCopy} label="Copy">
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </ActionBtn>
              <ActionBtn onClick={handleBookmark} label={isSaved ? 'Unsave' : 'Save'}>
                <Bookmark size={13} className={isSaved ? 'text-yellow-400' : ''} fill={isSaved ? 'currentColor' : 'none'} />
              </ActionBtn>
              <ActionBtn onClick={handleShare} label="Share">
                <Share2 size={13} />
              </ActionBtn>
              {message.audioUrl && (
                <ActionBtn onClick={handleDownload} label="Download audio">
                  <Download size={13} />
                </ActionBtn>
              )}
              <ActionBtn onClick={handleSaveToPhrasebook} label="Save to Phrasebook">
                <BookOpen size={13} />
              </ActionBtn>
            </div>
            <AudioPlayer id={message.id} url={message.audioUrl} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ActionBtn: React.FC<{ onClick: () => void; label: string; children: React.ReactNode }> = ({ onClick, label, children }) => (
  <button onClick={onClick} className="p-1.5 rounded-lg hover:bg-white/5 text-textSecondary hover:text-white transition-colors" aria-label={label}>
    {children}
  </button>
);
  const makeId = () => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch {
      // Older Android WebView fallback
    }
    return `phrase_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  };
