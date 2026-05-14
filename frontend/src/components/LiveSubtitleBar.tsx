import React from 'react';

type Props = {
  original: string;
  translated: string;
  active: boolean;
};

export const LiveSubtitleBar: React.FC<Props> = ({ original, translated, active }) => {
  if (!active && !original && !translated) return null;

  return (
    <div className="mb-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 shadow-glow">
      <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-primary">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
        Live subtitles
      </div>
      <p className="text-xs text-textSecondary">{original || 'Listening...'}</p>
      <p className="mt-1 text-sm text-textPrimary">{translated || 'Translating...'}</p>
    </div>
  );
};
