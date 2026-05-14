import React from 'react';
import toast from 'react-hot-toast';
import { Copy, Download, X } from 'lucide-react';
import { exportSummary } from '../services/api';

type Props = {
  open: boolean;
  summary: string;
  keywords: string[];
  languagePairs: string[];
  messageCount: number;
  onClose: () => void;
};

export const SummaryModal: React.FC<Props> = ({
  open,
  summary,
  keywords,
  languagePairs,
  messageCount,
  onClose,
}) => {
  if (!open) return null;

  const handleExport = async (format: 'txt' | 'pdf' | 'docx') => {
    const content = `Summary\n\n${summary}\n\nKeywords: ${keywords.join(', ')}\nLanguage Pairs: ${languagePairs.join(', ')}\nMessages: ${messageCount}`;
    const blob = await exportSummary(content, format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-summary.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-bg/95 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-outfit text-textPrimary">AI Conversation Summary</h3>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-2"><X size={14} /></button>
        </div>
        <p className="mb-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-textPrimary">{summary}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {keywords.map((k) => (
            <span key={k} className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary">{k}</span>
          ))}
        </div>
        <p className="mb-3 text-xs text-textSecondary">Language pairs: {languagePairs.join(', ') || 'N/A'} • Messages: {messageCount}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(summary);
              toast.success('Summary copied');
            }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
          ><Copy size={12} /> Copy</button>
          <button onClick={() => void handleExport('txt')} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"><Download size={12} /> TXT</button>
          <button onClick={() => void handleExport('pdf')} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"><Download size={12} /> PDF</button>
          <button onClick={() => void handleExport('docx')} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"><Download size={12} /> DOCX</button>
        </div>
      </div>
    </div>
  );
};
