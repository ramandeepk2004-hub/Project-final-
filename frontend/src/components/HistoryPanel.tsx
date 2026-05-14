import React from 'react';
import { History } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { MessageBubble } from './MessageBubble';

export const HistoryPanel: React.FC = () => {
  const { state } = useAppContext();
  const history = [...state.messages].sort((a, b) => Number(new Date(b.timestamp)) - Number(new Date(a.timestamp)));

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-6 pb-[8rem]">
      <div className="mb-6 flex items-center gap-2">
        <History size={20} className="text-primary" />
        <h2 className="text-lg font-outfit font-semibold">History</h2>
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-textSecondary">
          No translations yet
        </div>
      ) : (
        history.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
    </div>
  );
};
