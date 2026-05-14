import React from 'react';
import { MicOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const ErrorBanner: React.FC = () => {
  const { state, dispatch } = useAppContext();

  if (state.audioPermission !== 'denied' && !state.error) return null;

  return (
    <div className="mt-4 space-y-2">
      {state.audioPermission === 'denied' && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 flex items-start gap-3">
          <MicOff className="shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-semibold mb-1">Microphone Access Denied</p>
            <p className="opacity-80">Please enable microphone permissions in your browser settings to use the real-time translation feature.</p>
          </div>
        </div>
      )}
      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm">
              <p className="font-semibold mb-1">Runtime Error ({state.error.type})</p>
              <p className="opacity-90 break-words">{state.error.message}</p>
            </div>
            <button
              className="rounded-md border border-red-400/40 px-2 py-1 text-xs"
              onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      </div>
  );
};
