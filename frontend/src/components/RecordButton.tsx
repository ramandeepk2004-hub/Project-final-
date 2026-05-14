import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface RecordButtonProps {
  onStart: () => void;
  onStop: () => void;
  isActiveSpeaker?: boolean;
  disabled?: boolean;
  label?: string;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ 
  onStart, 
  onStop, 
  isActiveSpeaker = true, 
  disabled = false,
  label
}) => {
  const { state } = useAppContext();
  const { recordingState } = state;

  const isRecording = recordingState === 'recording' && isActiveSpeaker;
  const isProcessing = recordingState === 'processing' && isActiveSpeaker;
  const isIdle = recordingState === 'idle';
  // Disable if we are processing OR if someone else is recording
  const isButtonDisabled = disabled || isProcessing || (recordingState !== 'idle' && !isActiveSpeaker);

  const handleClick = () => {
    if (isButtonDisabled) return;
    if (isIdle) onStart();
    else if (isRecording) onStop();
  };

  return (
    <div className="flex h-20 flex-col items-center justify-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {isRecording && (
          <>
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-full h-full bg-red-500/30 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute w-full h-full bg-red-500/20 rounded-full"
            />
          </>
        )}
        <motion.button
          whileHover={{ scale: isButtonDisabled ? 1 : 1.05 }}
          whileTap={{ scale: isButtonDisabled ? 1 : 0.95 }}
          onClick={handleClick}
          disabled={isButtonDisabled}
          className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-glow transition-all duration-300 ${
            isRecording ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 
            isProcessing ? 'bg-surface border border-white/10 text-primary cursor-not-allowed' :
            isButtonDisabled ? 'bg-surface/50 text-textSecondary cursor-not-allowed' :
            'bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
          }`}
          aria-label={
            isIdle ? 'Start recording' : 
            isRecording ? 'Stop recording' : 'Processing'
          }
        >
          {isRecording ? (
            <div className="flex items-center justify-center gap-1 h-6">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
              animate={{ height: [7, 16, 7] }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity, 
                    delay: i * 0.1 
                  }}
                  className="w-1 bg-white rounded-full"
                />
              ))}
            </div>
          ) : isProcessing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Mic size={18} />
          )}
        </motion.button>
      </div>
      {label && (
        <span className={`mt-0.5 text-[11px] font-medium ${isRecording ? 'text-red-400' : 'text-textSecondary'}`}>
          {label}
        </span>
      )}
    </div>
  );
};
