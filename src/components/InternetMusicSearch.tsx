import React, { useState, useEffect, useRef } from 'react';
import { InternetSongResult } from '../types/playlist';
import { musicSearchService } from '../services/musicSearchService';
import {
  Search,
  Play,
  Pause,
  Plus,
  CornerDownRight,
  Disc,
  Clock,
  Sparkles,
  Loader2,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  FastForward,
  Zap,
  Info,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface InternetMusicSearchProps {
  onAddSong: (song: InternetSongResult) => void;
  onInsertAfterCurrent: (song: InternetSongResult) => void;
  currentSongTitle?: string;
}

const TRENDING_SEARCHES = [
  'Coldplay',
  'Taylor Swift',
  'Lofi Beats',
  'The Weeknd',
  'Billie Eilish',
  'Daft Punk',
  'Hans Zimmer',
  'Ed Sheeran',
  'Arijit Singh',
  'Queen',
  'Synthwave',
];

export const InternetMusicSearch: React.FC<InternetMusicSearchProps> = ({
  onAddSong,
  onInsertAfterCurrent,
  currentSongTitle,
}) => {
  const [query, setQuery] = useState('Coldplay');
  const [source, setSource] = useState<'full_only' | 'audius' | 'archive' | 'all' | 'itunes'>('full_only');
  const [results, setResults] = useState<InternetSongResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [resolvingIds, setResolvingIds] = useState<Record<string, boolean>>({});

  // Active Preview Player State (Independent from Circular Playlist)
  const [activePreviewTrack, setActivePreviewTrack] = useState<InternetSongResult | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(180);
  const [previewVolume, setPreviewVolume] = useState(0.8);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleSearch = async (
    searchQuery: string = query,
    currentSource: 'full_only' | 'audius' | 'archive' | 'all' | 'itunes' = source
  ) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const tracks = await musicSearchService.searchUniversal(trimmed, currentSource);
      setResults(tracks);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch('Coldplay', 'full_only');
    return () => {
      // Clean up audio on unmount
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // Convert 30s track to FULL SONG
  const handleConvertToFullSong = async (track: InternetSongResult) => {
    setResolvingIds((prev) => ({ ...prev, [track.id]: true }));
    try {
      const resolved = await musicSearchService.resolveFullLengthTrack(track);
      setResults((prev) =>
        prev.map((item) => (item.id === track.id ? resolved : item))
      );

      // If this track is currently loaded in the preview player, update it
      if (activePreviewTrack?.id === track.id) {
        setActivePreviewTrack(resolved);
        setPreviewDuration(resolved.duration);
        if (previewAudioRef.current) {
          const wasPlaying = isPreviewPlaying;
          previewAudioRef.current.pause();
          previewAudioRef.current.src = resolved.audioStreamUrl;
          previewAudioRef.current.currentTime = previewCurrentTime;
          if (wasPlaying) {
            previewAudioRef.current.play().catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('Resolution failed:', err);
    } finally {
      setResolvingIds((prev) => {
        const next = { ...prev };
        delete next[track.id];
        return next;
      });
    }
  };

  // Preview Playback Logic (Strictly for listening - NO AUTO ADDING)
  const handleTogglePreview = (track: InternetSongResult) => {
    // If clicking on same track that is playing, toggle pause
    if (activePreviewTrack?.id === track.id) {
      if (previewAudioRef.current) {
        if (isPreviewPlaying) {
          previewAudioRef.current.pause();
          setIsPreviewPlaying(false);
        } else {
          previewAudioRef.current.play().catch(() => {});
          setIsPreviewPlaying(true);
        }
      }
      return;
    }

    // Switch to new track
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const audio = new Audio(track.audioStreamUrl);
    audio.volume = isPreviewMuted ? 0 : previewVolume;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setPreviewDuration(audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      setPreviewCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setPreviewDuration(audio.duration);
      }
    };

    audio.onended = () => {
      setIsPreviewPlaying(false);
      setPreviewCurrentTime(0);
    };

    audio.onerror = () => {
      console.warn('Preview stream could not be loaded');
      setIsPreviewPlaying(false);
    };

    audio.play().catch((err) => {
      console.warn('Playback error:', err);
      setIsPreviewPlaying(false);
    });

    previewAudioRef.current = audio;
    setActivePreviewTrack(track);
    setIsPreviewPlaying(true);
    setPreviewCurrentTime(0);
    setPreviewDuration(track.duration || 180);
  };

  const handlePreviewSeek = (seconds: number) => {
    if (previewAudioRef.current) {
      const clamped = Math.max(0, Math.min(seconds, previewDuration));
      previewAudioRef.current.currentTime = clamped;
      setPreviewCurrentTime(clamped);
    }
  };

  const handlePreviewVolumeChange = (vol: number) => {
    setPreviewVolume(vol);
    setIsPreviewMuted(vol === 0);
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = vol;
    }
  };

  const handleAdd = (track: InternetSongResult) => {
    onAddSong(track);
    setAddedIds((prev) => ({ ...prev, [track.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[track.id];
        return next;
      });
    }, 2000);
  };

  const handleInsert = (track: InternetSongResult) => {
    onInsertAfterCurrent(track);
    setAddedIds((prev) => ({ ...prev, [track.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[track.id];
        return next;
      });
    }, 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const previewProgressPercent =
    previewDuration > 0 ? Math.min(100, (previewCurrentTime / previewDuration) * 100) : 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Search Header Banner */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Full-Length Songs Guaranteed
          </span>
          <span className="text-xs text-stone-400">
            Plays from 0:00 to the End (No 30-Second Cutoff)
          </span>
        </div>

        <h2 className="text-xl font-bold text-stone-100 mb-1">
          Search Any Song on the Internet
        </h2>
        <p className="text-xs text-stone-400 mb-4 max-w-2xl">
          Listen to any full song with the music scrubber bar. Click <strong>Listen</strong> to hear it immediately (without adding). When you want it in your Circular Doubly Linked List, click <strong>"+ Add"</strong> or <strong>"Insert After"</strong>!
        </p>

        {/* Informative Explanation Pill: Why were some songs 30s? */}
        <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-stone-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-300">Why are Apple Music / iTunes songs 30s?</span>{' '}
            Apple and commercial recording labels legally cap all third-party web preview clips to 30 seconds. To give you complete songs from start to finish, we default to{' '}
            <strong className="text-emerald-300">Full Songs (Audius + Internet Archive)</strong> where tracks play their full 3-6 minutes! If you ever pick an Apple result, click{' '}
            <strong className="text-amber-300">"⚡ Get Full Song"</strong> to instantly swap it with the complete full-length audio stream.
          </div>
        </div>

        {/* Input & Filters */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query, source);
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search any song, artist, album (e.g. Coldplay, Queen, Taylor Swift, Bohemian Rhapsody)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={source}
                onChange={(e) => {
                  const s = e.target.value as 'full_only' | 'audius' | 'archive' | 'all' | 'itunes';
                  setSource(s);
                  handleSearch(query, s);
                }}
                className="px-3 py-2.5 text-xs bg-stone-950 border border-stone-800 rounded-xl text-stone-300 focus:outline-none focus:border-amber-500"
              >
                <option value="full_only">Full Songs (Audius + Archive) [Recommended]</option>
                <option value="audius">Audius Open Network (Full Songs)</option>
                <option value="archive">Internet Archive (Full Masters & Live)</option>
                <option value="all">All Catalogs (Full + Apple 30s)</option>
                <option value="itunes">Apple Music Catalog (30s Previews)</option>
              </select>

              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20 disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Trending suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-stone-500 flex items-center gap-1 font-mono text-[11px]">
              <Flame className="w-3 h-3 text-amber-500" /> Trending:
            </span>
            {TRENDING_SEARCHES.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => {
                  setQuery(tag);
                  handleSearch(tag, source);
                }}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-950 border border-stone-800 hover:border-amber-500/50 hover:text-amber-300 text-stone-400 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Floating / Sticky Search Preview Player (Listen Only, Never Auto-Adds) */}
      {activePreviewTrack && (
        <div className="bg-stone-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden ring-4 ring-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-950 border border-stone-800 shrink-0 shadow-md">
                {activePreviewTrack.artworkUrl ? (
                  <img
                    src={activePreviewTrack.artworkUrl}
                    alt={activePreviewTrack.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-600">
                    <Disc className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Listening Only (Not Added)
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      activePreviewTrack.isFullLength
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {activePreviewTrack.isFullLength ? 'Full Song' : '30s Preview'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-100 truncate">
                  {activePreviewTrack.title}
                </h3>
                <p className="text-xs text-stone-400 truncate">
                  {activePreviewTrack.artist}
                </p>
              </div>
            </div>

            {/* Quick Actions for this preview track */}
            <div className="flex items-center gap-2 shrink-0">
              {!activePreviewTrack.isFullLength && (
                <button
                  onClick={() => handleConvertToFullSong(activePreviewTrack)}
                  disabled={resolvingIds[activePreviewTrack.id]}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Find the complete full-length version of this song"
                >
                  {resolvingIds[activePreviewTrack.id] ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>⚡ Get Full Song</span>
                </button>
              )}

              <button
                onClick={() => handleAdd(activePreviewTrack)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-colors"
                title="Add to Circular Linked List"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add to Playlist</span>
              </button>

              {currentSongTitle && (
                <button
                  onClick={() => handleInsert(activePreviewTrack)}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-cyan-300 border border-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title={`Insert after '${currentSongTitle}'`}
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Insert After Current</span>
                </button>
              )}
            </div>
          </div>

          {/* Scrubber (Music Bar) for Preview Player */}
          <div className="mt-4 pt-3 border-t border-stone-800/80">
            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button
                onClick={() => handleTogglePreview(activePreviewTrack)}
                className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center hover:bg-amber-400 transition-transform active:scale-95 shrink-0"
                title={isPreviewPlaying ? 'Pause' : 'Play'}
              >
                {isPreviewPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Jump -10s */}
              <button
                onClick={() => handlePreviewSeek(previewCurrentTime - 10)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Current Time */}
              <span className="font-mono text-xs text-stone-400 tabular-nums w-10 text-right">
                {formatTime(previewCurrentTime)}
              </span>

              {/* Scrubber Slider */}
              <div
                className="relative flex-1 h-3 flex items-center cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  handlePreviewSeek(pct * previewDuration);
                }}
              >
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                    style={{ width: `${previewProgressPercent}%` }}
                  />
                </div>
                <div
                  className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-md border border-stone-900 pointer-events-none -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${previewProgressPercent}%` }}
                />
              </div>

              {/* Duration */}
              <span className="font-mono text-xs text-stone-500 tabular-nums w-10">
                {formatTime(previewDuration)}
              </span>

              {/* Jump +10s */}
              <button
                onClick={() => handlePreviewSeek(previewCurrentTime + 10)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                title="Forward 10 seconds"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>

              {/* Volume Slider */}
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-stone-800">
                <button
                  onClick={() => handlePreviewVolumeChange(isPreviewMuted ? 0.8 : 0)}
                  className="text-stone-400 hover:text-stone-200"
                >
                  {isPreviewMuted || previewVolume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isPreviewMuted ? 0 : previewVolume}
                  onChange={(e) => handlePreviewVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-stone-800 rounded-lg accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <h3 className="text-sm font-semibold text-stone-200">
            Searching Global Music Catalog...
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm">
            Fetching full-length songs with unmetered streaming across decentralized audio nodes and open archives.
          </p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="py-16 text-center bg-stone-900/40 border border-stone-800 rounded-2xl p-8">
          <Disc className="w-10 h-10 text-stone-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-300 mb-1">No tracks found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
            No matches for "{query}". Try checking your spelling or search for popular artists like Coldplay, Queen, or Taylor Swift.
          </p>
          <button
            onClick={() => {
              setQuery('Coldplay');
              handleSearch('Coldplay', 'full_only');
            }}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium"
          >
            Reset to Coldplay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((track) => {
            const isCurrentlyPlaying = activePreviewTrack?.id === track.id && isPreviewPlaying;
            const isAdded = addedIds[track.id];
            const isResolving = resolvingIds[track.id];

            return (
              <div
                key={track.id}
                className={`bg-stone-900/70 border rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 ${
                  activePreviewTrack?.id === track.id
                    ? 'border-amber-500/60 bg-amber-500/5 shadow-lg'
                    : 'border-stone-800/80 hover:border-stone-700 hover:bg-stone-900/90'
                }`}
              >
                {/* Track Card Body */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Artwork + Quick Play Overlay */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-950 border border-stone-800 shrink-0 group/cover">
                    {track.artworkUrl ? (
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-900 text-stone-600">
                        <Disc className="w-7 h-7" />
                      </div>
                    )}

                    {/* Overlay play button for preview */}
                    <button
                      onClick={() => handleTogglePreview(track)}
                      className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                        isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'
                      }`}
                      title={isCurrentlyPlaying ? 'Pause listening' : 'Play / Listen to song'}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-6 h-6 text-amber-400 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Title, Artist, Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          track.isFullLength
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                            : 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                        }`}
                      >
                        {track.isFullLength ? 'Full Song' : '30s Preview'}
                      </span>

                      {!track.isFullLength && (
                        <button
                          type="button"
                          onClick={() => handleConvertToFullSong(track)}
                          disabled={isResolving}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition-colors"
                          title="Convert this 30s snippet to full 3-5 minute complete song"
                        >
                          {isResolving ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Zap className="w-2.5 h-2.5" />
                          )}
                          <span>{isResolving ? 'Finding...' : '⚡ Full Song'}</span>
                        </button>
                      )}

                      <span className="text-[10px] text-stone-500 font-mono truncate">
                        {track.source.toUpperCase()}
                      </span>
                    </div>

                    <h4
                      className="text-sm font-semibold text-stone-100 truncate group-hover:text-amber-300 transition-colors"
                      title={track.title}
                    >
                      {track.title}
                    </h4>

                    <p className="text-xs text-stone-400 truncate" title={track.artist}>
                      {track.artist}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500 mt-1">
                      <Clock className="w-3 h-3 text-stone-500" />
                      <span>{formatTime(track.duration)} ({track.duration}s)</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Explicit listen and add buttons) */}
                <div className="pt-3 border-t border-stone-800/80 flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePreview(track)}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
                      isCurrentlyPlaying
                        ? 'bg-amber-500 text-stone-950 font-semibold'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                    }`}
                    title="Listen to this song without adding it to the playlist"
                  >
                    {isCurrentlyPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Listening...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleAdd(track)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border ${
                      isAdded
                        ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                        : 'bg-amber-500/10 hover:bg-amber-500 hover:text-stone-950 border-amber-500/30 text-amber-300'
                    }`}
                    title="Add to Circular Linked List: addSong(title, duration)"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add</span>
                      </>
                    )}
                  </button>

                  {currentSongTitle && (
                    <button
                      onClick={() => handleInsert(track)}
                      className="py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-cyan-300 text-xs transition-colors"
                      title={`insertAfter('${currentSongTitle}', '${track.title}')`}
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
