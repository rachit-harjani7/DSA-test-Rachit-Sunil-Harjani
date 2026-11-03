import React from 'react';
import { Coffee, Play, CloudRain, Volume2, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'player' | 'search' | 'visualizer' | 'staff' | 'assessment' | 'theory';
  setActiveTab: (tab: 'player' | 'search' | 'visualizer' | 'staff' | 'assessment' | 'theory') => void;
  isAmbianceActive: boolean;
  onToggleAmbiance: () => void;
  onQuickRunTest: () => void;
  songCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAmbianceActive,
  onToggleAmbiance,
  onQuickRunTest,
  songCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark & Student Details */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-stone-100 whitespace-nowrap">
                Melody Café Player
              </span>
              <span className="hidden xl:inline-block text-[10px] font-mono text-stone-400 border border-stone-800 rounded px-1.5 py-0.5 bg-stone-900/60">
                Circular DLL
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-amber-400 font-medium whitespace-nowrap">Rachit Sunil Harjani</span>
              <span className="text-stone-600">·</span>
              <span className="font-mono text-[11px] text-stone-300 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded leading-none whitespace-nowrap">
                PRN: 25070721006
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Single-line navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'player'
                ? 'bg-stone-800 text-amber-400 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            Music Player ({songCount})
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'search'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <span>Search Web Songs</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">100M+</span>
          </button>

          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'visualizer'
                ? 'bg-stone-800 text-amber-400 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            Linked List Graph
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'staff'
                ? 'bg-stone-800 text-amber-400 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            Staff Operations
          </button>

          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'assessment'
                ? 'bg-stone-800 text-amber-400 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            Part C Test Suite
          </button>

          <button
            onClick={() => setActiveTab('theory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'theory'
                ? 'bg-stone-800 text-amber-400 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            Part A & D Answers
          </button>
        </nav>

        {/* Zone 3: Primary Action & Ambiance Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleAmbiance}
            title={isAmbianceActive ? 'Mute Café Rain & Vinyl Ambiance' : 'Play Cozy Café Rain & Vinyl Ambiance'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
              isAmbianceActive
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-300 shadow-sm shadow-amber-950/50'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Café Rain</span>
          </button>

          <button
            onClick={onQuickRunTest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold transition-colors whitespace-nowrap shadow-sm shadow-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run Part C Test</span>
          </button>
        </div>
      </div>

      {/* Mobile nav pills */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-stone-800/80 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('player')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'player' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400'
          }`}
        >
          Player ({songCount})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'search' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400'
          }`}
        >
          Search Web 🌐
        </button>
        <button
          onClick={() => setActiveTab('visualizer')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'visualizer' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400'
          }`}
        >
          Graph
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'staff' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400'
          }`}
        >
          Staff
        </button>
        <button
          onClick={() => setActiveTab('assessment')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'assessment' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400'
          }`}
        >
          Part C Test
        </button>
        <button
          onClick={() => setActiveTab('theory')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'theory' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400'
          }`}
        >
          Exam Answers
        </button>
      </div>
    </header>
  );
};
