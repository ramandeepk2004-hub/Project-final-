import React, { useRef, useState } from 'react';
import { evaluatePronunciation } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = { open: boolean; onClose: () => void };

export const PronunciationCoachModal: React.FC<Props> = ({ open, onClose }) => {
  const { state } = useAppContext();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [expected, setExpected] = useState('');
  const [result, setResult] = useState<{ score: number; feedback: string[]; fluency: number; confidence: number; clarity: number } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const onEvaluate = async (file: File) => {
    if (!expected.trim()) {
      toast.error('Enter expected phrase first');
      return;
    }
    setLoading(true);
    try {
      const res = await evaluatePronunciation(file, expected, state.languageA);
      setResult(res);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Pronunciation check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-bg/95 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-outfit">Pronunciation Practice</h3>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-2"><X size={14} /></button>
        </div>
        <input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Enter phrase to practice" className="mb-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm" />
        <button onClick={() => fileRef.current?.click()} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">Upload recording</button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void onEvaluate(file); }} />
        {loading && <p className="mt-3 text-sm text-primary">Analyzing pronunciation...</p>}
        {result && (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm">Score: <span className="text-primary">{result.score}</span></p>
            <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-primary" style={{ width: `${result.score}%` }} /></div>
            <div className="mt-2 text-xs text-textSecondary">Fluency {result.fluency}% • Confidence {result.confidence}% • Clarity {result.clarity}%</div>
            <ul className="mt-2 space-y-1 text-xs text-textSecondary">{result.feedback.map((f) => <li key={f}>• {f}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
};
