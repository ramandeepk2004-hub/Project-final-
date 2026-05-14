import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  analyserNode: React.RefObject<AnalyserNode | null>;
  isActive: boolean;
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  analyserNode,
  isActive,
  barCount = 24,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !analyserNode.current || !canvasRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const analyser = analyserNode.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncCanvasSize = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 64;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
    };

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const step = Math.floor(bufferLength / barCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 64;
      const barWidth = width / barCount;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        const barHeight = Math.max(4, value * height * 0.88);
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.98)');
        gradient.addColorStop(0.5, 'rgba(129, 140, 248, 0.88)');
        gradient.addColorStop(1, 'rgba(34, 211, 238, 0.82)');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(99, 102, 241, 0.45)';

        ctx.beginPath();
        ctx.roundRect(x, y, w, barHeight, 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [isActive, analyserNode, barCount]);

  if (!isActive) return null;

  return (
    <div className="mx-auto mb-4 flex w-full max-w-md justify-center rounded-3xl border border-primary/20 bg-primary/5 px-4 py-4 shadow-[0_0_35px_rgba(99,102,241,0.18)]">
      <canvas
        ref={canvasRef}
        className="h-16 w-full max-w-sm opacity-95 transition-opacity duration-300"
      />
    </div>
  );
};
