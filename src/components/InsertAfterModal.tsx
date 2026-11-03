import React, { useState, useEffect } from 'react';
import { X, CornerDownRight } from 'lucide-react';

interface InsertAfterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultKey: string;
  songTitles: string[];
  onInsertAfter: (key: string, title: string, duration: number) => { success: boolean; message: string };
}

export const InsertAfterModal: React.FC<InsertAfterModalProps> = ({
  isOpen,
  onClose,
  defaultKey,
  songTitles,
  onInsertAfter,
}) => {
  const [key, setKey] = useState(defaultKey);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('200');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (defaultKey) {
      setKey(defaultKey);
    }
  }, [defaultKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !title.trim()) return;

    const dur = Math.max(1, parseInt(duration, 10) || 200);
    const result = onInsertAfter(key.trim(), title.trim().slice(0, 30), dur);

    if (result.success) {
      setTitle('');
      setDuration('200');
      setErrorMsg(null);
      onClose();
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <CornerDownRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-100">
              Insert After Song
            </h3>
            <p className="text-xs text-stone-400">
              Calls <code className="text-cyan-400">insertAfter(key, title, duration)</code>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-stone-300 mb-1">
              Insert immediately after (Key Song):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-cyan-500 font-medium"
              />
              {songTitles.length > 0 && (
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="px-2 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-400 focus:outline-none"
                >
                  {songTitles.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-300 mb-1">
              New Song Title <span className="text-stone-500">(max 30 chars)</span>
            </label>
            <input
              type="text"
              required
              maxLength={30}
              placeholder="e.g. Skyline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-300 mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              required
              min={1}
              max={9999}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!key.trim() || !title.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-stone-950 transition-colors disabled:opacity-40"
            >
              Insert Song
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
