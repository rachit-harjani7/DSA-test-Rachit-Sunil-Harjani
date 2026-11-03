import React from 'react';
import { NodeSnapshot } from '../types/playlist';
import {
  Play,
  Trash2,
  Plus,
  Clock,
  ArrowRight,
  ListMusic,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';

interface PlaylistListViewProps {
  nodes: NodeSnapshot[];
  currentSongId?: string;
  onPlaySong: (title: string) => void;
  onRemoveSong: (title: string) => void;
  onOpenInsertAfterModal: (keyTitle: string) => void;
  onOpenAddModal: () => void;
  onOpenSearch?: () => void;
  onResetDefault: () => void;
  onUpgradeToFullLength?: (title: string) => void;
}

export const PlaylistListView: React.FC<PlaylistListViewProps> = ({
  nodes,
  currentSongId,
  onPlaySong,
  onRemoveSong,
  onOpenInsertAfterModal,
  onOpenAddModal,
  onOpenSearch,
  onResetDefault,
  onUpgradeToFullLength,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalDuration = nodes.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold text-stone-100">
              Melody Café Queue
            </h3>
            <span className="text-xs font-mono text-stone-400 tabular-nums">
              ({nodes.length} songs · {Math.floor(totalDuration / 60)}m {totalDuration % 60}s)
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Doubly circular traversal sequence (head to tail, auto-loops)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700"
              title="Search internet songs"
            >
              <span>Search Web</span>
            </button>
          )}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          <button
            onClick={onResetDefault}
            title="Load initial Melody Café playlist"
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors border border-stone-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Playlist Items */}
      {nodes.length === 0 ? (
        <div className="py-12 text-center text-stone-500 flex flex-col items-center">
          <p className="text-sm text-stone-400 mb-2">Playlist is empty</p>
          <button
            onClick={onResetDefault}
            className="text-xs text-amber-400 hover:underline"
          >
            Load 5 Practical Assessment Songs
          </button>
        </div>
      ) : (
        <div className="divide-y divide-stone-800/60 overflow-y-auto max-h-[460px] pr-1 mt-2">
          {nodes.map((node, index) => {
            const isPlaying = node.id === currentSongId;

            return (
              <div
                key={node.id}
                className={`py-3 px-3 rounded-xl flex items-center justify-between gap-3 group transition-colors ${
                  isPlaying
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'hover:bg-stone-800/40'
                }`}
              >
                {/* Number & Play Icon & Optional Artwork */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 text-center font-mono text-xs text-stone-500 group-hover:hidden">
                    {index + 1}
                  </div>
                  <button
                    onClick={() => onPlaySong(node.title)}
                    className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 items-center justify-center hidden group-hover:flex transition-transform hover:scale-110 shrink-0"
                    title="Play song"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>

                  {node.albumArtUrl ? (
                    <img
                      src={node.albumArtUrl}
                      alt={node.title}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-stone-800"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isPlaying ? 'text-amber-400' : 'text-stone-200'
                        }`}
                      >
                        {node.title}
                      </span>
                      {node.isHead && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          head
                        </span>
                      )}
                      {node.isTail && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          tail
                        </span>
                      )}
                      {(node.duration <= 35 || node.sourceCatalog === 'itunes') && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            30s preview
                          </span>
                          {onUpgradeToFullLength && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpgradeToFullLength(node.title);
                              }}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
                              title="Upgrade to full 3-5 min song"
                            >
                              ⚡ Get Full Song
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>{node.artist}</span>
                      <span>·</span>
                      <span className="font-mono text-stone-400">
                        {formatTime(node.duration)} ({node.duration}s)
                      </span>
                      <span>·</span>
                      <span className="font-mono text-cyan-400/80 text-[11px] hidden sm:inline flex items-center gap-1">
                        next: {node.nextTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Item Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onOpenInsertAfterModal(node.title)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-cyan-400 hover:bg-stone-800 transition-colors"
                    title={`Insert after '${node.title}'`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveSong(node.title)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                    title={`Remove '${node.title}' (customer complaint)`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
