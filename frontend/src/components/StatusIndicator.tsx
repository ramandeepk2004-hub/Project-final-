import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';

export const StatusIndicator: React.FC = () => {
  const { state } = useAppContext();
  const isRecording = state.recordingState === 'recording';
  
  const getStatusText = () => {
    switch (state.recordingState) {
      case 'recording': return 'Listening';
      case 'processing': return 'Translating...';
      default: return 'Tap to speak';
    }
  };

  return (
    <div className="mb-2 min-h-9 flex flex-col items-center justify-center gap-0.5">
      <AnimatePresence mode="wait">
        <motion.div
          key={state.recordingState}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className={`flex items-center gap-1 text-xs font-medium ${
            state.recordingState === 'recording' ? 'text-red-400' :
            state.recordingState === 'processing' ? 'text-primary' :
            'text-textSecondary'
          }`}
        >
          <span>{getStatusText()}</span>
          {isRecording && (
            <span className="flex items-center gap-0.5">
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: index * 0.18 }}
                  className="block h-1.5 w-1.5 rounded-full bg-current"
                />
              ))}
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isRecording && (
          <motion.p
            key={state.liveTranscriptText || 'listening-placeholder'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="max-w-xl text-center text-xs text-textSecondary"
          >
            {state.liveTranscriptText || 'Listening...'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
