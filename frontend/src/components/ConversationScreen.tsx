import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AudioLines } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useAppContext } from '../context/AppContext';

const SpeakerPanel: React.FC<{
  speaker: 'A' | 'B';
  title: string;
  accent: string;
}> = ({ speaker, title, accent }) => {
  const { state } = useAppContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = state.messages.filter((message) => message.mode === 'conversation' && message.speaker === speaker);
  const isActive = state.activeSpeaker === speaker && state.recordingState === 'recording';

  useEffect(() => {
    if (state.settings.autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, state.settings.autoScroll]);

  return (
    <section className={`relative flex min-h-[28rem] flex-col rounded-[2rem] border border-white/10 bg-white/5 p-5 ${accent}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-textSecondary">Speaker {speaker}</p>
          <h3 className="text-xl font-outfit text-textPrimary">{title}</h3>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs ${isActive ? 'border-primary/40 bg-primary/15 text-primary' : 'border-white/10 bg-black/20 text-textSecondary'}`}>
          {isActive ? 'Listening' : 'Ready'}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm text-textSecondary">
          <AudioLines size={16} className={isActive ? 'text-primary' : ''} />
          Transcript
        </div>
        <p className="min-h-16 text-sm leading-relaxed text-textPrimary">
          {isActive && state.activeSpeaker === speaker
            ? (state.liveTranscriptText || 'Listening...')
            : 'Waiting for speech...'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-center text-sm text-textSecondary">
            {speaker === 'A'
              ? `Speaker A speaks ${state.languageA.toUpperCase()} and receives ${state.languageB.toUpperCase()} translations.`
              : `Speaker B speaks ${state.languageB.toUpperCase()} and receives ${state.languageA.toUpperCase()} translations.`}
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </section>
  );
};

export const ConversationScreen: React.FC = () => {
  return (
    <div
      className="flex-1 h-full w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-8 md:pt-10 overflow-y-auto scrollbar-hide"
      style={{ paddingBottom: 'calc(var(--control-panel-height, 12.5rem) + var(--mobile-nav-height, 0px) + 2.5rem)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <SpeakerPanel speaker="A" title="Original speaker" accent="shadow-[0_0_30px_rgba(99,102,241,0.08)]" />
        <SpeakerPanel speaker="B" title="Reply speaker" accent="shadow-[0_0_30px_rgba(14,165,233,0.08)]" />
      </motion.div>
    </div>
  );
};
