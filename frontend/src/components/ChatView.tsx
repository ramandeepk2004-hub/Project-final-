import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { useAppContext } from '../context/AppContext';

export const ChatView: React.FC = () => {
  const { state } = useAppContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatMessages = state.messages.filter((message) => message.mode === 'chat' || message.mode === 'image');

  useEffect(() => {
    if (state.settings.autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, state.settings.autoScroll]);

  return (
    <div
      className="flex-1 h-full w-full max-w-5xl mx-auto px-4 md:px-8 pt-8 md:pt-10 overflow-y-auto scrollbar-hide"
      style={{ paddingBottom: 'calc(var(--control-panel-height, 12.5rem) + var(--mobile-nav-height, 0px) + 2.5rem)' }}
    >
      {chatMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center opacity-60">
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center shadow-glow">
              <span className="text-4xl">🌐</span>
            </div>
            <h2 className="text-2xl font-outfit font-medium text-textPrimary mb-3">
              Ready to Translate
            </h2>
            <p className="text-sm text-textSecondary max-w-md mx-auto leading-relaxed">
              Single-screen translation for text, voice, and image workflows. Speak, type, or upload an image to translate into {state.languageB.toUpperCase()}.
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col">
          {chatMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={bottomRef} className="h-4" />
        </div>
      )}

      <AnimatePresence>
        {state.recordingState === 'recording' && state.livePreviewText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky mx-auto mt-4 mb-2 bg-primary/20 border border-primary/30 rounded-2xl px-6 py-4 max-w-lg shadow-glow backdrop-blur-md"
            style={{ bottom: 'calc(var(--control-panel-height, 12.5rem) + var(--mobile-nav-height, 0px) + 1rem)' }}
          >
            <p className="text-white text-lg font-outfit italic tracking-wide">
              {state.liveTranscriptText || state.livePreviewText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
