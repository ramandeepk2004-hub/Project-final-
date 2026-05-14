import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SuggestionsStripProps {
  onUseSuggestion: (text: string) => void;
}

export const SuggestionsStrip: React.FC<SuggestionsStripProps> = ({ onUseSuggestion }) => {
  const { state } = useAppContext();

  if (state.suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-textSecondary">
        <Sparkles size={14} className="text-primary" />
        Smart Replies
      </div>
      <div className="scrollbar-dark flex gap-2 overflow-x-auto pb-1">
        {state.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onUseSuggestion(suggestion)}
            className="whitespace-nowrap rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-textPrimary transition-all hover:border-primary/40 hover:bg-primary/15"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
