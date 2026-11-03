import React, { useState } from 'react';
import { X, Plus, Music, Upload, Check, Search, Globe, Loader2, Play, Pause, Disc } from 'lucide-react';
import { musicSearchService } from '../services/musicSearchService';
import { InternetSongResult } from '../types/playlist';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (
    title: string,
    duration: number,
    artist?: string,
    genre?: string,
    customAudioUrl?: string,
    audioStreamUrl?: string,
    albumArtUrl?: string
  ) => void;
}

export const AddSongModal: React.FC<AddSongModalProps> = ({
  isOpen,
  onClose,
  onAddSong,
}) => {
  const [mode, setMode] = useState<'search' | 'manual'>('search');

  // Manual Form
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('180');
  const [artist, setArtist] = useState('Melody Café Resident');
  const [genre, setGenre] = useState('Café Lo-Fi');
  const [customAudioUrl, setCustomAudioUrl] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | null>(null);

  // Internet Search Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InternetSongResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAudioUrl(url);
      setFileName(file.name);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 30);
        setTitle(cleanName);
      }
    }
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    stopPreview();
    try {
      const tracks = await musicSearchService.searchUniversal(q.trim());
      setSearchResults(tracks);
    } catch (err) {
      console.warn('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTogglePreview = (track: InternetSongResult) => {
    if (previewTrackId === track.id) {
      stopPreview();
      return;
    }
    stopPreview();
    if (track.audioStreamUrl) {
      const audio = new Audio(track.audioStreamUrl);
      audio.onended = () => setPreviewTrackId(null);
      audio.onerror = () => setPreviewTrackId(null);
      audio.play().catch(() => setPreviewTrackId(null));
      previewAudioRef.current = audio;
      setPreviewTrackId(track.id);
    }
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewTrackId(null);
  };

  const handleSelectInternetTrack = async (track: InternetSongResult) => {
    stopPreview();
    let finalTrack = track;
    if (!track.isFullLength) {
      finalTrack = await musicSearchService.resolveFullLengthTrack(track);
    }
    onAddSong(
      finalTrack.title.slice(0, 30),
      finalTrack.duration,
      finalTrack.artist,
      finalTrack.genre,
      undefined,
      finalTrack.audioStreamUrl,
      finalTrack.artworkUrl
    );
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dur = Math.max(1, parseInt(duration, 10) || 180);
    onAddSong(
      title.trim().slice(0, 30),
      dur,
      artist.trim() || 'Melody Café Resident',
      genre.trim() || 'Café Lo-Fi',
      customAudioUrl
    );

    setTitle('');
    setDuration('180');
    setCustomAudioUrl(undefined);
    setFileName(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            stopPreview();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-100">
              Add Song to Playlist
            </h3>
            <p className="text-xs text-stone-400">
              Calls <code className="text-amber-400">addSong(title, duration)</code> on Circular DLL
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-stone-950 rounded-xl border border-stone-800 mb-4">
          <button
            type="button"
            onClick={() => {
              stopPreview();
              setMode('search');
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'search'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Search Internet (100M+ Songs)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopPreview();
              setMode('manual');
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'manual'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Manual / File Upload</span>
          </button>
        </div>

        {/* MODE 1: Search Internet */}
        {mode === 'search' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type any song or artist name (e.g. Coldplay, Queen, Adele)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center gap-1 disabled:opacity-40"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Find</span>
              </button>
            </form>

            {/* Quick search tags */}
            <div className="flex items-center gap-1 flex-wrap text-[11px]">
              <span className="text-stone-500">Popular:</span>
              {['Viva La Vida', 'Cruel Summer', 'Blinding Lights', 'Night Changes', 'Lofi Girl'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    handleSearch(tag);
                  }}
                  className="px-2 py-0.5 rounded bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-800"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto max-h-[300px] divide-y divide-stone-800/80 pr-1">
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center text-stone-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-2" />
                  <span>Searching global music database...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-10 text-center text-stone-500 text-xs">
                  Type any song title or artist above to search every song existing on the internet.
                </div>
              ) : (
                searchResults.map((track) => {
                  const isPreviewing = previewTrackId === track.id;

                  return (
                    <div
                      key={track.id}
                      className="py-2.5 flex items-center justify-between gap-3 group hover:bg-stone-800/40 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Artwork */}
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-950 border border-stone-800 shrink-0">
                          {track.artworkUrl ? (
                            <img
                              src={track.artworkUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-600">
                              <Disc className="w-5 h-5" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTogglePreview(track)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Preview audio"
                          >
                            {isPreviewing ? (
                              <Pause className="w-4 h-4 text-amber-400 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-stone-200 truncate">
                              {track.title}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                                track.isFullLength
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {track.isFullLength ? 'Full Song' : '30s'}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 truncate flex items-center gap-1.5">
                            <span>{track.artist}</span>
                            <span>·</span>
                            <span className="font-mono text-stone-500">{track.duration}s</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectInternetTrack(track)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shrink-0 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* MODE 2: Manual Form & Custom File Upload */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-stone-300 mb-1">
                Title <span className="text-stone-500">(max 30 characters)</span>
              </label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="e.g. Amber Roast"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-stone-300 mb-1">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Café Lo-Fi">Café Lo-Fi</option>
                  <option value="Ambient Chill">Ambient Chill</option>
                  <option value="City Pop">City Pop</option>
                  <option value="Jazzhop">Jazzhop</option>
                  <option value="Synthwave">Synthwave</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 mb-1">
                Artist
              </label>
              <input
                type="text"
                placeholder="Melody Café Resident"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Optional file upload */}
            <div className="pt-2 border-t border-stone-800">
              <label className="block text-xs font-mono text-stone-400 mb-1.5 flex items-center justify-between">
                <span>Optional: Custom Audio File</span>
                <span className="text-[10px] text-stone-500">MP3 / WAV</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-file-input"
                />
                <label
                  htmlFor="audio-file-input"
                  className="w-full py-2 px-3 border border-dashed border-stone-700 hover:border-amber-500/50 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-xs text-stone-400 hover:text-stone-200 transition-colors bg-stone-950/40"
                >
                  {fileName ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[200px] text-emerald-300 font-mono text-[11px]">
                        {fileName}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-stone-400" />
                      <span>Upload Audio (or use Synth)</span>
                    </>
                  )}
                </label>
              </div>
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
                disabled={!title.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors disabled:opacity-40"
              >
                Add to End of Playlist
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
