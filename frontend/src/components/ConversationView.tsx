import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { useAppContext } from '../context/AppContext';

export const ConversationView: React.FC = () => {
  const { state } = useAppContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const showLivePreview = state.recordingState === 'recording' && state.livePreviewText;

  useEffect(() => {
    if (state.settings.autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages, state.settings.autoScroll]);

  return (
    <div className="flex-1 h-full w-full max-w-5xl mx-auto px-4 md:px-8 pt-8 md:pt-10 pb-[24rem] md:pb-[22rem] overflow-y-auto scrollbar-hide">
      {state.messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center opacity-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center shadow-glow">
              <span className="text-4xl">🌌</span>
            </div>
            <h2 className="text-2xl font-outfit font-medium text-textPrimary mb-3">
              {state.appMode === 'conversation' ? 'Conversation Ready' : 'Ready to Translate'}
            </h2>
            <p className="text-sm text-textSecondary max-w-sm mx-auto leading-relaxed">
              {state.appMode === 'conversation'
                ? `Speaker A speaks ${state.languageA.toUpperCase()}, Speaker B speaks ${state.languageB.toUpperCase()}.`
                : `Translating from ${state.languageA.toUpperCase()} -> ${state.languageB.toUpperCase()}. Tap the mic to begin.`}
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col">
          {state.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          <div ref={bottomRef} className="h-4" />
        </div>
      )}

      <AnimatePresence>
        {showLivePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky bottom-[18rem] md:bottom-[16rem] mx-auto mt-4 mb-2 bg-primary/20 border border-primary/30 rounded-2xl px-6 py-4 max-w-lg shadow-glow backdrop-blur-md"
          >
            <p className="text-white text-lg font-outfit italic tracking-wide">
              "{state.livePreviewText}"
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-1 h-5 bg-primary ml-1 align-middle"
              />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
