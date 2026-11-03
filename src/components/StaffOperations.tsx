import React, { useState } from 'react';
import { OperationLog } from '../types/playlist';
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CornerDownRight,
  Terminal,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ListPlus,
} from 'lucide-react';

interface StaffOperationsProps {
  onAddSong: (title: string, duration: number) => void;
  onInsertAfter: (key: string, title: string, duration: number) => { success: boolean; message: string };
  onRemoveSong: (title: string) => { success: boolean; message: string };
  onDisplayForward: () => string[];
  onDisplayBackward: () => string[];
  onPlayNext: () => void;
  onPlayPrev: () => void;
  logs: OperationLog[];
  onClearLogs: () => void;
  songTitles: string[];
}

export const StaffOperations: React.FC<StaffOperationsProps> = ({
  onAddSong,
  onInsertAfter,
  onRemoveSong,
  onDisplayForward,
  onDisplayBackward,
  onPlayNext,
  onPlayPrev,
  logs,
  onClearLogs,
  songTitles,
}) => {
  // Form states
  const [addTitle, setAddTitle] = useState('');
  const [addDuration, setAddDuration] = useState('180');

  const [insertKey, setInsertKey] = useState('');
  const [insertTitle, setInsertTitle] = useState('');
  const [insertDuration, setInsertDuration] = useState('200');

  const [removeTitle, setRemoveTitle] = useState('');
  const [lastMessage, setLastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim()) return;
    const dur = parseInt(addDuration, 10) || 180;
    onAddSong(addTitle.trim().slice(0, 30), dur);
    setLastMessage({ text: `addSong("${addTitle.trim()}", ${dur}) executed.` });
    setAddTitle('');
  };

  const handleInsertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insertKey.trim() || !insertTitle.trim()) return;
    const dur = parseInt(insertDuration, 10) || 200;
    const res = onInsertAfter(insertKey.trim(), insertTitle.trim().slice(0, 30), dur);
    setLastMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setInsertTitle('');
    }
  };

  const handleRemoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeTitle.trim()) return;
    const res = onRemoveSong(removeTitle.trim());
    setLastMessage({ text: res.message, isError: !res.success });
    setRemoveTitle('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Operations Form Column (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        {/* Status notification if any */}
        {lastMessage && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-mono border ${
              lastMessage.isError
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            }`}
          >
            {lastMessage.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{lastMessage.text}</span>
          </div>
        )}

        {/* 1. addSong(title, duration) */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-200">
                Operation B(a): <code className="text-amber-400">addSong(title, duration)</code>
              </h4>
              <p className="text-xs text-stone-400">
                Adds a new song at the end of the playlist (connects tail.next to new node and loops back to head).
              </p>
            </div>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-stone-400 mb-1">
                  Song Title (max 30 chars)
                </label>
                <input
                  type="text"
                  maxLength={30}
                  placeholder="e.g. Cinnamon Brew"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">
                  Duration (secs)
                </label>
                <input
                  type="number"
                  min={10}
                  max={999}
                  placeholder="e.g. 190"
                  value={addDuration}
                  onChange={(e) => setAddDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!addTitle.trim()}
              className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Execute addSong()
            </button>
          </form>
        </div>

        {/* 2. insertAfter(key, title, duration) */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <CornerDownRight className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-200">
                Operation B(b): <code className="text-cyan-400">insertAfter(key, title, duration)</code>
              </h4>
              <p className="text-xs text-stone-400">
                Inserts a new song immediately after the song named key. Prints a message if key is not found.
              </p>
            </div>
          </div>

          <form onSubmit={handleInsertSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">
                Target Key Song (existing song title)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Sunrise or Marina Lights"
                  value={insertKey}
                  onChange={(e) => setInsertKey(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-cyan-500"
                />
                {songTitles.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setInsertKey(e.target.value);
                    }}
                    className="px-2 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-400 focus:outline-none"
                  >
                    <option value="">Quick pick...</option>
                    {songTitles.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-stone-400 mb-1">
                  New Song Title
                </label>
                <input
                  type="text"
                  maxLength={30}
                  placeholder="e.g. Skyline"
                  value={insertTitle}
                  onChange={(e) => setInsertTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">
                  Duration (secs)
                </label>
                <input
                  type="number"
                  min={10}
                  max={999}
                  placeholder="200"
                  value={insertDuration}
                  onChange={(e) => setInsertDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!insertKey.trim() || !insertTitle.trim()}
              className="w-full py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Execute insertAfter()
            </button>
          </form>
        </div>

        {/* 3. removeSong(title) */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-200">
                Operation B(c): <code className="text-rose-400">removeSong(title)</code>
              </h4>
              <p className="text-xs text-stone-400">
                Removes first song with title (handles first/middle/last/single node). Prints message if not found.
              </p>
            </div>
          </div>

          <form onSubmit={handleRemoveSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Sunrise or Desert Rain or Unknown"
                value={removeTitle}
                onChange={(e) => setRemoveTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-rose-500"
              />
              {songTitles.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setRemoveTitle(e.target.value);
                  }}
                  className="px-2 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-400 focus:outline-none"
                >
                  <option value="">Pick active song...</option>
                  {songTitles.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="Unknown">"Unknown" (Test edge-case)</option>
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={!removeTitle.trim()}
              className="w-full py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Execute removeSong()
            </button>
          </form>
        </div>

        {/* 4. Traversal Operations B(d) & B(e) */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <h4 className="text-sm font-semibold text-stone-200 mb-3">
            Operations B(d) & B(e): Traversal & Playback Pointer
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onDisplayForward()}
              className="p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono flex flex-col items-center gap-1 border border-stone-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span>displayForward()</span>
            </button>
            <button
              onClick={() => onDisplayBackward()}
              className="p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono flex flex-col items-center gap-1 border border-stone-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400" />
              <span>displayBackward()</span>
            </button>
            <button
              onClick={onPlayNext}
              className="p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono flex flex-col items-center gap-1 border border-stone-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span>playNext()</span>
            </button>
            <button
              onClick={onPlayPrev}
              className="p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono flex flex-col items-center gap-1 border border-stone-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>playPrev()</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operation Log Terminal Column (5 cols) */}
      <div className="lg:col-span-5 bg-stone-950 border border-stone-800 rounded-2xl p-5 flex flex-col h-[540px] shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-semibold text-stone-200">
              Melody Café Console Output
            </span>
          </div>
          <button
            onClick={onClearLogs}
            className="text-[11px] font-mono text-stone-500 hover:text-stone-300 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Terminal logs list */}
        <div className="flex-1 overflow-y-auto font-mono text-xs py-3 space-y-2 pr-1 select-text">
          {logs.length === 0 ? (
            <div className="text-stone-600 italic py-8 text-center">
              // Output stream idle. Perform operations or run the Part C test suite to see output.
            </div>
          ) : (
            logs.map((log) => {
              const colorMap: Record<string, string> = {
                add: 'text-amber-400',
                insert: 'text-cyan-400',
                remove: 'text-rose-400',
                display: 'text-emerald-400',
                play: 'text-purple-400',
                test: 'text-yellow-400 font-bold',
                error: 'text-rose-400 font-semibold',
              };

              return (
                <div key={log.id} className="leading-relaxed">
                  <span className="text-stone-600 text-[10px] mr-2">
                    {log.timestamp}
                  </span>
                  <span className={colorMap[log.type] || 'text-stone-300'}>
                    {log.message}
                  </span>
                  {log.details && (
                    <div className="text-stone-400 pl-4 text-[11px] whitespace-pre-wrap">
                      {log.details}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-stone-900 text-[11px] font-mono text-stone-600 flex items-center justify-between">
          <span>CLO 4 · Linked List Application Design</span>
          <span>{logs.length} events</span>
        </div>
      </div>
    </div>
  );
};
