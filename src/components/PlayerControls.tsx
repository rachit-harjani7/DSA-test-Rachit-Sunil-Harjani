import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  RotateCcw,
  FastForward,
} from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  hasSongs: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onSeek,
  onVolumeChange,
  hasSongs,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isDragging, setIsDragging] = useState(false);
  const [localSeekTime, setLocalSeekTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const effectiveDuration = Math.max(1, duration || 100);
  const displayTime = isDragging && localSeekTime !== null ? localSeekTime : currentTime;
  const progressPercent = Math.min(100, Math.max(0, (displayTime / effectiveDuration) * 100));

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekCommit = (newTime: number) => {
    const clamped = Math.max(0, Math.min(newTime, effectiveDuration));
    setLocalSeekTime(null);
    setIsDragging(false);
    onSeek(clamped);
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasSongs || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = pct * effectiveDuration;
    handleSeekCommit(targetSeconds);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume || 0.7);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md select-none">
      {/* Time Progress Bar / Audio Scrubber */}
      <div className="mb-4">
        <div
          ref={progressBarRef}
          onClick={handleTrackClick}
          className="relative group py-2 cursor-pointer flex items-center"
        >
          {/* Background track */}
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden relative group-hover:h-2.5 transition-all">
            {/* Filled active track */}
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full transition-all duration-75 relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Draggable Thumb Indicator */}
          <div
            className="absolute w-4 h-4 bg-amber-400 rounded-full shadow-md border-2 border-stone-950 pointer-events-none transform -translate-x-1/2 group-hover:scale-125 transition-transform"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Hidden range input over the track for smooth drag & touch events */}
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            step={0.25}
            value={displayTime}
            disabled={!hasSongs}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onInput={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              setLocalSeekTime(val);
            }}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              handleSeekCommit(val);
            }}
            onMouseUp={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              handleSeekCommit(val);
            }}
            onTouchEnd={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              handleSeekCommit(val);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mt-1 tabular-nums">
          <span className="font-semibold text-amber-300">{formatTime(displayTime)}</span>
          <span className="text-stone-500 font-sans text-xs hidden sm:inline">
            Click or drag anywhere on bar to skip
          </span>
          <span>{formatTime(effectiveDuration)}</span>
        </div>
      </div>

      {/* Main Buttons Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Jump 10s */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSeekCommit(Math.max(0, currentTime - 10))}
            disabled={!hasSongs}
            title="Rewind 10 seconds"
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSeekCommit(Math.min(effectiveDuration, currentTime + 10))}
            disabled={!hasSongs}
            title="Fast-forward 10 seconds"
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Previous / Play-Pause / Next (Linked List Operations) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onPlayPrev}
            disabled={!hasSongs}
            title="Previous song (node.prev)"
            className="p-2.5 text-stone-300 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={!hasSongs}
            className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-40 disabled:hover:bg-amber-500 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onPlayNext}
            disabled={!hasSongs}
            title="Next song (node.next - circular)"
            className="p-2.5 text-stone-300 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Right Side: Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setIsMuted(val === 0);
              onVolumeChange(val);
            }}
            className="w-16 sm:w-20 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
