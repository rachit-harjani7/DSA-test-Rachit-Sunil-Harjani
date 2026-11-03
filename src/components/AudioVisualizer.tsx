import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  accentColor?: string;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  accentColor = '#f59e0b',
  barCount = 28,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let fallbackPhases = Array.from({ length: barCount }, (_, i) => i * 0.3);

    const render = () => {
      const analyser = audioEngine.getAnalyser();
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let dataArray: Uint8Array | null = null;
      if (analyser && isPlaying) {
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        (analyser as AnalyserNode & { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(dataArray);
      }

      const totalBars = barCount;
      const barSpacing = 3;
      const totalSpacing = barSpacing * (totalBars - 1);
      const barWidth = Math.max(2, (width - totalSpacing) / totalBars);

      for (let i = 0; i < totalBars; i++) {
        let normalizedHeight = 0.08;

        if (isPlaying && dataArray) {
          // sample frequency range
          const dataIndex = Math.min(
            dataArray.length - 1,
            Math.floor((i / totalBars) * (dataArray.length * 0.75))
          );
          const rawVal = dataArray[dataIndex] || 0;
          normalizedHeight = Math.max(0.08, rawVal / 255);
        } else if (isPlaying) {
          // procedural fallback subtle pulse
          fallbackPhases[i] += 0.05;
          normalizedHeight = 0.15 + 0.35 * Math.abs(Math.sin(fallbackPhases[i]));
        } else {
          // idle resting state
          normalizedHeight = 0.06;
        }

        const barHeight = Math.max(3, normalizedHeight * (height - 4));
        const x = i * (barWidth + barSpacing);
        const y = height - barHeight;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(1, 'rgba(217, 119, 6, 0.2)');

        ctx.fillStyle = gradient;
        // Rounded bar caps
        const radius = Math.min(barWidth / 2, 2);
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, accentColor, barCount]);

  return (
    <div className="w-full h-12 flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={340}
        height={48}
        className="w-full h-full block"
      />
    </div>
  );
};
