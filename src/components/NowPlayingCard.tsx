import React from 'react';
import { SongNode } from '../models/CircularDoublyLinkedList';
import { AudioVisualizer } from './AudioVisualizer';
import { Disc, ArrowRight, ArrowLeft, Clock, Music, AlertCircle, Zap } from 'lucide-react';

interface NowPlayingCardProps {
  currentSong: SongNode | null;
  isPlaying: boolean;
  duration?: number;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onTogglePlay: () => void;
  onUpgradeToFullLength?: (title: string) => void;
}

export const NowPlayingCard: React.FC<NowPlayingCardProps> = ({
  currentSong,
  isPlaying,
  duration,
  onPlayNext,
  onPlayPrev,
  onTogglePlay,
  onUpgradeToFullLength,
}) => {
  const displayDuration = duration || currentSong?.duration || 0;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentSong) {
    return (
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-stone-800/80 border border-stone-700/60 flex items-center justify-center text-stone-500 mb-4">
          <Music className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-stone-300 mb-1">Melody Café Jukebox Ready</h3>
        <p className="text-xs text-stone-500 max-w-sm mb-4">
          No song is currently selected. Add a song or run the Part C practical assessment test suite to populate the circular playlist.
        </p>
      </div>
    );
  }

  const moodAccents: Record<string, { ring: string; gradient: string; hex: string }> = {
    sunrise: { ring: 'ring-amber-500/30', gradient: 'from-amber-600 via-orange-500 to-rose-600', hex: '#f59e0b' },
    desert_rain: { ring: 'ring-teal-500/30', gradient: 'from-teal-600 via-cyan-600 to-emerald-700', hex: '#14b8a6' },
    marina_lights: { ring: 'ring-indigo-500/30', gradient: 'from-blue-600 via-indigo-600 to-violet-700', hex: '#6366f1' },
    skyline: { ring: 'ring-pink-500/30', gradient: 'from-amber-600 via-pink-600 to-purple-700', hex: '#ec4899' },
    night_drive: { ring: 'ring-purple-500/30', gradient: 'from-purple-700 via-indigo-800 to-stone-900', hex: '#a855f7' },
    custom: { ring: 'ring-stone-500/30', gradient: 'from-stone-700 via-amber-800 to-stone-900', hex: '#d97706' },
  };

  const accent = moodAccents[currentSong.moodTheme] || moodAccents.custom;

  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-sm shadow-xl shadow-black/40">
      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-15 bg-gradient-to-br ${accent.gradient} pointer-events-none`}
      />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
        {/* Animated Vinyl Record Graphic */}
        <div className="relative group shrink-0">
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-stone-950 border-4 border-stone-800/90 shadow-2xl flex items-center justify-center relative overflow-hidden ring-4 ${accent.ring} transition-transform ${
              isPlaying ? 'animate-[spin_7s_linear_infinite]' : ''
            }`}
          >
            {/* Vinyl record grooves */}
            <div className="absolute inset-2 rounded-full border border-stone-800/60" />
            <div className="absolute inset-5 rounded-full border border-stone-800/40" />
            <div className="absolute inset-8 rounded-full border border-stone-800/30" />
            <div className="absolute inset-11 rounded-full border border-stone-800/20" />

            {/* Center Album Label */}
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr ${accent.gradient} p-0.5 flex items-center justify-center shadow-inner overflow-hidden`}
            >
              {currentSong.albumArtUrl ? (
                <img
                  src={currentSong.albumArtUrl}
                  alt={currentSong.title}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-stone-950 border border-stone-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
              )}
            </div>
          </div>

          {/* Floating playing indicator badge */}
          {isPlaying && (
            <span className="absolute bottom-1 right-1 bg-amber-500 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
              PLAYING
            </span>
          )}
        </div>

        {/* Song Info & Live Pointer Connectivity */}
        <div className="flex-1 w-full text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-stone-400 mb-2">
            <span className="font-medium text-amber-400/90 tracking-wide uppercase text-[11px]">
              {currentSong.genre}
            </span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="flex items-center gap-1 font-mono text-stone-400">
              <Clock className="w-3 h-3 text-stone-500" />
              {formatTime(displayDuration)} ({Math.round(displayDuration)}s)
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100 truncate mb-1">
            {currentSong.title}
          </h2>

          <p className="text-sm text-stone-400 mb-3">
            {currentSong.artist}
          </p>

          {/* 30s Preview Warning & 1-Click Upgrade Banner */}
          {(displayDuration <= 35 || currentSong.sourceCatalog === 'itunes') && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>30-second studio preview (Apple copyright limitation)</span>
              </div>
              {onUpgradeToFullLength && (
                <button
                  onClick={() => onUpgradeToFullLength(currentSong.title)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-[11px] shrink-0 transition-colors flex items-center justify-center gap-1 shadow-sm"
                  title="Search decentralized audio nodes for full 3-5 minute complete song"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>⚡ Switch to Full Song (3-5 min)</span>
                </button>
              )}
            </div>
          )}

          {/* Real-time Circular Linked List Pointer Display */}
          <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3 mb-4">
            <div className="text-[11px] font-mono text-stone-400 mb-2 flex items-center justify-between">
              <span>Circular Linked List Pointers</span>
              <span className="text-amber-400/80">Memory Ref</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={onPlayPrev}
                title={`Jump to previous node: ${currentSong.prev.title}`}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-stone-900 hover:bg-stone-800/80 border border-stone-800 transition-colors text-left group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400 transition-colors shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-stone-500 uppercase font-mono">prev pointer</div>
                  <div className="font-medium text-stone-300 truncate text-[12px] group-hover:text-stone-100">
                    {currentSong.prev.title}
                  </div>
                </div>
              </button>

              <button
                onClick={onPlayNext}
                title={`Jump to next node: ${currentSong.next.title}`}
                className="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-stone-900 hover:bg-stone-800/80 border border-stone-800 transition-colors text-right group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-stone-500 uppercase font-mono">next pointer</div>
                  <div className="font-medium text-stone-300 truncate text-[12px] group-hover:text-stone-100">
                    {currentSong.next.title}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Real-Time Audio Frequency Visualizer */}
          <AudioVisualizer isPlaying={isPlaying} accentColor={accent.hex} barCount={32} />
        </div>
      </div>
    </div>
  );
};
