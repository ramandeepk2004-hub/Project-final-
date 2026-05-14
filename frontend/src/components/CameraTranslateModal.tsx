import React, { useRef, useState } from 'react';
import { cameraTranslate } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = { open: boolean; onClose: () => void };

export const CameraTranslateModal: React.FC<Props> = ({ open, onClose }) => {
  const { state } = useAppContext();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [blocks, setBlocks] = useState<Array<{ text: string; translated: string; box: { x: number; y: number; w: number; h: number } }>>([]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const onFrame = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const res = await cameraTranslate(file, state.languageB, state.languageA);
      setBlocks(res.blocks || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Camera translate failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="h-[92vh] w-full max-w-3xl rounded-2xl border border-white/10 bg-bg/95 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-outfit">Camera Live Translate</h3>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-2"><X size={14} /></button>
        </div>
        <div className="relative h-[72vh] overflow-hidden rounded-xl border border-white/10 bg-black/30">
          {preview ? <img src={preview} alt="Camera frame" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-textSecondary">Capture or upload a camera frame</div>}
          {blocks.map((b, i) => (
            <div key={`${b.text}-${i}`} className="absolute rounded border border-primary/60 bg-primary/10 px-1 py-0.5 text-[10px] text-primary" style={{ left: `${b.box.x}px`, top: `${b.box.y}px` }}>
              {b.translated}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">Capture image</button>
          <button onClick={() => { setBlocks([]); setPreview(''); }} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">Retry</button>
          {loading && <span className="self-center text-xs text-primary">Extracting and translating...</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void onFrame(file); }} />
      </div>
    </div>
  );
};
