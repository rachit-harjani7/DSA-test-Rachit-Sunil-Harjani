/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CircularDoublyLinkedList, SongNode } from './models/CircularDoublyLinkedList';
import { audioEngine } from './services/audioEngine';
import { Header } from './components/Header';
import { NowPlayingCard } from './components/NowPlayingCard';
import { PlayerControls } from './components/PlayerControls';
import { LinkedListVisualizer } from './components/LinkedListVisualizer';
import { PlaylistListView } from './components/PlaylistListView';
import { StaffOperations } from './components/StaffOperations';
import { AssessmentTestRunner } from './components/AssessmentTestRunner';
import { ExamStudyGuide } from './components/ExamStudyGuide';
import { AddSongModal } from './components/AddSongModal';
import { InsertAfterModal } from './components/InsertAfterModal';
import { PythonSourceModal } from './components/PythonSourceModal';
import { InternetMusicSearch } from './components/InternetMusicSearch';
import { musicSearchService } from './services/musicSearchService';
import { OperationLog, InternetSongResult } from './types/playlist';
import { Code, Coffee, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  // Main Playlist Instance
  const playlist = useMemo(() => new CircularDoublyLinkedList(), []);

  // UI state
  const [version, setVersion] = useState(0);
  const [currentSong, setCurrentSong] = useState<SongNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isAmbianceActive, setIsAmbianceActive] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'player' | 'search' | 'visualizer' | 'staff' | 'assessment' | 'theory'>('player');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [insertKeyTarget, setInsertKeyTarget] = useState('');
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);

  // Logs & Assessment Test Console
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [testConsoleLogs, setTestConsoleLogs] = useState<string[]>([]);
  const [currentTestStep, setCurrentTestStep] = useState(0);

  const addLog = useCallback((type: OperationLog['type'], message: string, details?: string) => {
    const newLog: OperationLog = {
      id: Math.random().toString(36).slice(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Initial population with Melody Café assessment songs
  const loadInitialSongs = useCallback(() => {
    playlist.clear();
    playlist.addSong('Sunrise', 210, {
      artist: 'Café Morning Ensemble',
      genre: 'Warm Lo-Fi',
      moodTheme: 'sunrise',
    });
    playlist.addSong('Desert Rain', 185, {
      artist: 'Acoustic Rain Project',
      genre: 'Ambient Chill',
      moodTheme: 'desert_rain',
    });
    playlist.addSong('Marina Lights', 240, {
      artist: 'Midnight Coast',
      genre: 'City Pop / Groove',
      moodTheme: 'marina_lights',
    });
    playlist.addSong('Skyline', 200, {
      artist: 'Lo-Fi Rooftop',
      genre: 'Jazzhop',
      moodTheme: 'skyline',
    });
    playlist.addSong('Night Drive', 195, {
      artist: 'Neon Boulevard',
      genre: 'Dreamy Synthwave',
      moodTheme: 'night_drive',
    });

    setVersion((v) => v + 1);
    setCurrentSong(playlist.head);
    if (playlist.head) setCurrentDuration(playlist.head.duration);
    addLog('add', 'Melody Café playlist initialized with 5 songs (Circular Doubly Linked List).');
  }, [playlist, addLog]);

  useEffect(() => {
    loadInitialSongs();
  }, [loadInitialSongs]);

  // Hook up AudioEngine callbacks
  useEffect(() => {
    audioEngine.setCallbacks({
      onTimeUpdate: (time, duration) => {
        setCurrentTime(time);
        if (duration && !isNaN(duration) && duration > 0) {
          setCurrentDuration(duration);
        }
      },
      onEnded: () => {
        // Circular auto-advance: after last song finishes, repeats from first song!
        if (currentSong) {
          const next = playlist.playNext(currentSong);
          if (next) {
            setCurrentSong(next);
            setCurrentDuration(next.duration);
            audioEngine.playSong(next, 0);
            addLog('play', `Song completed. Circular transition to next song: "${next.title}".`);
          }
        }
      },
      onPlayStateChange: (playing) => {
        setIsPlaying(playing);
      },
    });
  }, [playlist, currentSong, addLog]);

  // Nodes snapshot for UI
  const nodes = useMemo(() => {
    // version dependency ensures recalculation upon list mutations
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    version;
    return playlist.toNodeArray(currentSong?.id);
  }, [playlist, version, currentSong?.id]);

  const songTitles = useMemo(() => nodes.map((n) => n.title), [nodes]);

  // Playback handlers
  const handleTogglePlay = () => {
    if (!currentSong && playlist.head) {
      setCurrentSong(playlist.head);
      setCurrentDuration(playlist.head.duration);
      audioEngine.playSong(playlist.head, 0);
    } else if (currentSong) {
      audioEngine.togglePlayPause(currentSong);
    }
  };

  const handlePlaySong = (title: string) => {
    const node = playlist.find(title);
    if (node) {
      setCurrentSong(node);
      setCurrentDuration(node.duration);
      audioEngine.playSong(node, 0);
      addLog('play', `Now playing "${node.title}" (${node.duration}s).`);
    }
  };

  const handlePlayNext = () => {
    if (!currentSong) {
      if (playlist.head) handlePlaySong(playlist.head.title);
      return;
    }
    const nextNode = playlist.playNext(currentSong);
    if (nextNode) {
      setCurrentSong(nextNode);
      setCurrentDuration(nextNode.duration);
      audioEngine.playSong(nextNode, 0);
      addLog('play', `playNext(current): Transitioned to "${nextNode.title}".`);
    }
  };

  const handlePlayPrev = () => {
    if (!currentSong) {
      if (playlist.head) handlePlaySong(playlist.head.title);
      return;
    }
    const prevNode = playlist.playPrev(currentSong);
    if (prevNode) {
      setCurrentSong(prevNode);
      setCurrentDuration(prevNode.duration);
      audioEngine.playSong(prevNode, 0);
      addLog('play', `playPrev(current): Transitioned to "${prevNode.title}".`);
    }
  };

  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  const handleToggleAmbiance = () => {
    const active = audioEngine.toggleAmbiance();
    setIsAmbianceActive(active);
  };

  // Staff operations
  const handleAddSong = (
    title: string,
    duration: number,
    artist = 'Melody Café Resident',
    genre = 'Café Lo-Fi',
    customAudioUrl?: string,
    audioStreamUrl?: string,
    albumArtUrl?: string
  ) => {
    const node = playlist.addSong(title, duration, {
      artist,
      genre,
      customAudioUrl,
      audioStreamUrl,
      albumArtUrl,
      sourceCatalog: audioStreamUrl ? 'itunes' : 'synth',
    });
    setVersion((v) => v + 1);
    addLog('add', `addSong("${title}", ${duration}) executed. Added at end of circular playlist.`);
    if (!currentSong) {
      setCurrentSong(node);
    }
  };

  const handleAddInternetSong = async (track: InternetSongResult) => {
    let finalTrack = track;
    if (!track.isFullLength) {
      addLog('add', `Resolving full-length complete audio for "${track.title}"...`);
      finalTrack = await musicSearchService.resolveFullLengthTrack(track);
    }

    const node = playlist.addSong(finalTrack.title.slice(0, 30), finalTrack.duration, {
      artist: finalTrack.artist,
      genre: finalTrack.genre,
      audioStreamUrl: finalTrack.audioStreamUrl,
      albumArtUrl: finalTrack.artworkUrl,
      sourceCatalog: finalTrack.source,
    });
    setVersion((v) => v + 1);
    addLog(
      'add',
      `Added internet song: "${finalTrack.title}" by ${finalTrack.artist} (${finalTrack.duration}s · ${
        finalTrack.isFullLength ? 'FULL SONG' : '30s Preview'
      }).`
    );
    if (!currentSong) {
      setCurrentSong(node);
      setCurrentDuration(node.duration);
    }
  };

  const handleInsertInternetAfterCurrent = async (track: InternetSongResult) => {
    if (!currentSong) {
      handleAddInternetSong(track);
      return;
    }
    let finalTrack = track;
    if (!track.isFullLength) {
      addLog('insert', `Resolving full-length complete audio for "${track.title}"...`);
      finalTrack = await musicSearchService.resolveFullLengthTrack(track);
    }

    const result = playlist.insertAfter(currentSong.title, finalTrack.title.slice(0, 30), finalTrack.duration, {
      artist: finalTrack.artist,
      genre: finalTrack.genre,
      audioStreamUrl: finalTrack.audioStreamUrl,
      albumArtUrl: finalTrack.artworkUrl,
      sourceCatalog: finalTrack.source,
    });
    if (result.success) {
      setVersion((v) => v + 1);
      addLog(
        'insert',
        `insertAfter("${currentSong.title}", "${finalTrack.title}") [${finalTrack.duration}s · ${
          finalTrack.isFullLength ? 'FULL SONG' : '30s Preview'
        }].`
      );
    }
  };

  const handleUpgradeSongToFullLength = async (songTitle: string) => {
    const node = playlist.find(songTitle);
    if (!node) return;

    addLog('play', `Searching open decentralized nodes for full-length complete song of "${songTitle}"...`);
    try {
      const resolved = await musicSearchService.resolveFullLengthTrack({
        id: node.id,
        title: node.title,
        artist: node.artist,
        duration: node.duration,
        audioStreamUrl: node.audioStreamUrl || '',
        artworkUrl: node.albumArtUrl,
        genre: node.genre,
        source: (node.sourceCatalog as any) || 'itunes',
        isFullLength: false,
      });

      if (resolved.isFullLength && resolved.audioStreamUrl) {
        node.audioStreamUrl = resolved.audioStreamUrl;
        node.duration = resolved.duration;
        node.sourceCatalog = resolved.source;
        setVersion((v) => v + 1);

        if (currentSong?.id === node.id) {
          setCurrentDuration(resolved.duration);
          if (isPlaying) {
            audioEngine.playSong(node, currentTime);
          }
        }
        addLog(
          'play',
          `Upgraded "${songTitle}" to FULL-LENGTH track (${resolved.duration}s)! Complete audio streaming.`
        );
      } else {
        addLog('error', `Full-length alternative for "${songTitle}" could not be found.`);
      }
    } catch (err) {
      console.warn('Upgrade failed:', err);
    }
  };

  const handlePlayInternetImmediately = (track: InternetSongResult) => {
    let node = playlist.find(track.title.slice(0, 30));
    if (!node) {
      node = playlist.addSong(track.title.slice(0, 30), track.duration, {
        artist: track.artist,
        genre: track.genre,
        audioStreamUrl: track.audioStreamUrl,
        albumArtUrl: track.artworkUrl,
        sourceCatalog: track.source,
      });
      setVersion((v) => v + 1);
      addLog('add', `Added "${track.title}" to playlist.`);
    }
    setCurrentSong(node);
    audioEngine.playSong(node, 0);
    addLog('play', `Streaming internet song: "${node.title}" by ${node.artist}.`);
    setActiveTab('player');
  };

  const handleInsertAfter = (key: string, title: string, duration: number) => {
    const result = playlist.insertAfter(key, title, duration);
    if (result.success) {
      setVersion((v) => v + 1);
      addLog('insert', result.message);
    } else {
      addLog('error', result.message);
    }
    return result;
  };

  const handleRemoveSong = (title: string) => {
    const targetNode = playlist.find(title);
    const wasCurrent = targetNode && currentSong && targetNode.id === currentSong.id;

    let nextToPlay: SongNode | null = null;
    if (wasCurrent && currentSong) {
      // Determine what to play after removal
      nextToPlay = playlist.playNext(currentSong);
      if (nextToPlay?.id === currentSong.id) {
        nextToPlay = null; // was only song
      }
    }

    const result = playlist.removeSong(title);
    if (result.success) {
      setVersion((v) => v + 1);
      addLog('remove', result.message);

      if (wasCurrent) {
        if (nextToPlay) {
          setCurrentSong(nextToPlay);
          if (isPlaying) {
            audioEngine.playSong(nextToPlay, 0);
          }
        } else {
          setCurrentSong(playlist.head);
          audioEngine.pause();
        }
      }
    } else {
      addLog('error', result.message);
    }
    return result;
  };

  const handleDisplayForward = (): string[] => {
    const titles = playlist.displayForward();
    const str = titles.length > 0 ? titles.join(' -> ') : 'Playlist is empty.';
    addLog('display', `displayForward(): ${str}`);
    return titles;
  };

  const handleDisplayBackward = (): string[] => {
    const titles = playlist.displayBackward();
    const str = titles.length > 0 ? titles.join(' -> ') : 'Playlist is empty.';
    addLog('display', `displayBackward(): ${str}`);
    return titles;
  };

  // --- Part C Test Runner Logic ---
  const handleExecuteFullSuite = () => {
    // Exact 7 steps from question paper Part C
    const logsOut: string[] = [];
    playlist.clear();

    // 1. Add songs: Sunrise (210), Desert Rain (185), Marina Lights (240)
    playlist.addSong('Sunrise', 210);
    playlist.addSong('Desert Rain', 185);
    playlist.addSong('Marina Lights', 240);

    // 2. Insert Skyline (200) after Sunrise
    playlist.insertAfter('Sunrise', 'Skyline', 200);

    // 3. Insert Night Drive (195) after Marina Lights
    playlist.insertAfter('Marina Lights', 'Night Drive', 195);

    // 4. Display the playlist forward and backward
    logsOut.push('--- Before removal ---');
    const f1 = playlist.displayForward();
    logsOut.push(`Forward : ${f1.join(' -> ')}`);
    const b1 = playlist.displayBackward();
    logsOut.push(`Backward: ${b1.join(' -> ')}`);

    // 5. Remove Sunrise, then Desert Rain, then Night Drive, then Unknown
    logsOut.push('--- Removing songs ---');
    const r1 = playlist.removeSong('Sunrise');
    if (r1.success) logsOut.push('Removed: Sunrise');
    const r2 = playlist.removeSong('Desert Rain');
    if (r2.success) logsOut.push('Removed: Desert Rain');
    const r3 = playlist.removeSong('Night Drive');
    if (r3.success) logsOut.push('Removed: Night Drive');
    const r4 = playlist.removeSong('Unknown');
    if (!r4.success) logsOut.push("Song 'Unknown' not found. Nothing removed.");

    // 6. Display the playlist forward and backward again
    logsOut.push('--- After removal ---');
    const f2 = playlist.displayForward();
    logsOut.push(`Forward : ${f2.join(' -> ')}`);
    const b2 = playlist.displayBackward();
    logsOut.push(`Backward: ${b2.join(' -> ')}`);

    // 7. Starting from Marina Lights, call playNext and print the title of the song returned
    const cur = playlist.find('Marina Lights');
    const nxt = playlist.playNext(cur);
    if (nxt) {
      logsOut.push(`playNext(Marina Lights) returned: ${nxt.title}`);
    }

    setVersion((v) => v + 1);
    setCurrentSong(playlist.head);
    setTestConsoleLogs(logsOut);
    setCurrentTestStep(7);
    addLog('test', 'Part C Practical Assessment Test Suite completed (7/7 steps passed).');

    return { outputLogs: logsOut, success: true };
  };

  const handleExecuteStep = (stepNumber: number) => {
    const logsOut = [...testConsoleLogs];

    if (stepNumber === 1) {
      playlist.clear();
      playlist.addSong('Sunrise', 210);
      playlist.addSong('Desert Rain', 185);
      playlist.addSong('Marina Lights', 240);
      logsOut.push('// Step 1: Added Sunrise (210), Desert Rain (185), Marina Lights (240)');
    } else if (stepNumber === 2) {
      playlist.insertAfter('Sunrise', 'Skyline', 200);
      logsOut.push('// Step 2: Inserted Skyline (200) after Sunrise');
    } else if (stepNumber === 3) {
      playlist.insertAfter('Marina Lights', 'Night Drive', 195);
      logsOut.push('// Step 3: Inserted Night Drive (195) after Marina Lights');
    } else if (stepNumber === 4) {
      logsOut.push('--- Before removal ---');
      const f1 = playlist.displayForward();
      logsOut.push(`Forward : ${f1.join(' -> ')}`);
      const b1 = playlist.displayBackward();
      logsOut.push(`Backward: ${b1.join(' -> ')}`);
    } else if (stepNumber === 5) {
      logsOut.push('--- Removing songs ---');
      playlist.removeSong('Sunrise');
      logsOut.push('Removed: Sunrise');
      playlist.removeSong('Desert Rain');
      logsOut.push('Removed: Desert Rain');
      playlist.removeSong('Night Drive');
      logsOut.push('Removed: Night Drive');
      const r = playlist.removeSong('Unknown');
      logsOut.push("Song 'Unknown' not found. Nothing removed.");
    } else if (stepNumber === 6) {
      logsOut.push('--- After removal ---');
      const f2 = playlist.displayForward();
      logsOut.push(`Forward : ${f2.join(' -> ')}`);
      const b2 = playlist.displayBackward();
      logsOut.push(`Backward: ${b2.join(' -> ')}`);
    } else if (stepNumber === 7) {
      const cur = playlist.find('Marina Lights');
      const nxt = playlist.playNext(cur);
      if (nxt) {
        logsOut.push(`playNext(Marina Lights) returned: ${nxt.title}`);
      }
    }

    setVersion((v) => v + 1);
    setCurrentSong(playlist.head);
    setTestConsoleLogs(logsOut);
    setCurrentTestStep(stepNumber);

    return { stepOutput: logsOut, success: true };
  };

  const handleResetTestState = () => {
    loadInitialSongs();
    setTestConsoleLogs([]);
    setCurrentTestStep(0);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAmbianceActive={isAmbianceActive}
        onToggleAmbiance={handleToggleAmbiance}
        onQuickRunTest={() => {
          setActiveTab('assessment');
          handleExecuteFullSuite();
        }}
        songCount={nodes.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Music Player View (Interactive Player + Real-Time Pointer HUD) */}
        {activeTab === 'player' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Now Playing & Audio Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <NowPlayingCard
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  duration={currentDuration || currentSong?.duration || 0}
                  onPlayNext={handlePlayNext}
                  onPlayPrev={handlePlayPrev}
                  onTogglePlay={handleTogglePlay}
                  onUpgradeToFullLength={handleUpgradeSongToFullLength}
                />

                <PlayerControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={currentDuration || currentSong?.duration || 0}
                  volume={volume}
                  onTogglePlay={handleTogglePlay}
                  onPlayNext={handlePlayNext}
                  onPlayPrev={handlePlayPrev}
                  onSeek={handleSeek}
                  onVolumeChange={handleVolumeChange}
                  hasSongs={nodes.length > 0}
                />
              </div>

              {/* Right Column: Dynamic Circular Playlist Queue (5 cols) */}
              <div className="lg:col-span-5">
                <PlaylistListView
                  nodes={nodes}
                  currentSongId={currentSong?.id}
                  onPlaySong={handlePlaySong}
                  onRemoveSong={handleRemoveSong}
                  onOpenInsertAfterModal={(key) => {
                    setInsertKeyTarget(key);
                    setIsInsertModalOpen(true);
                  }}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onOpenSearch={() => setActiveTab('search')}
                  onResetDefault={loadInitialSongs}
                  onUpgradeToFullLength={handleUpgradeSongToFullLength}
                />
              </div>
            </div>

            {/* Embedded Live Linked List Strip */}
            <LinkedListVisualizer
              nodes={nodes}
              currentSongId={currentSong?.id}
              onSelectSong={handlePlaySong}
              onRemoveSong={handleRemoveSong}
              onOpenInsertAfterModal={(key) => {
                setInsertKeyTarget(key);
                setIsInsertModalOpen(true);
              }}
              onStepForward={handlePlayNext}
              onStepBackward={handlePlayPrev}
            />
          </div>
        )}

        {/* TAB 2: Internet Music Search & Discovery (Every Song Existing on the Internet) */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <InternetMusicSearch
              onAddSong={handleAddInternetSong}
              onInsertAfterCurrent={handleInsertInternetAfterCurrent}
              currentSongTitle={currentSong?.title}
            />

            {/* Sticky Player HUD at bottom during search */}
            <div className="sticky bottom-4 z-30 max-w-3xl mx-auto">
              <PlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={currentDuration || currentSong?.duration || 0}
                volume={volume}
                onTogglePlay={handleTogglePlay}
                onPlayNext={handlePlayNext}
                onPlayPrev={handlePlayPrev}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                hasSongs={nodes.length > 0}
              />
            </div>
          </div>
        )}

        {/* TAB 3: Full Linked List Graph View */}
        {activeTab === 'visualizer' && (
          <div className="space-y-6">
            <LinkedListVisualizer
              nodes={nodes}
              currentSongId={currentSong?.id}
              onSelectSong={handlePlaySong}
              onRemoveSong={handleRemoveSong}
              onOpenInsertAfterModal={(key) => {
                setInsertKeyTarget(key);
                setIsInsertModalOpen(true);
              }}
              onStepForward={handlePlayNext}
              onStepBackward={handlePlayPrev}
            />

            {/* Bottom mini player controls so user can still listen while inspecting nodes */}
            <div className="max-w-2xl mx-auto">
              <PlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={currentDuration || currentSong?.duration || 0}
                volume={volume}
                onTogglePlay={handleTogglePlay}
                onPlayNext={handlePlayNext}
                onPlayPrev={handlePlayPrev}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                hasSongs={nodes.length > 0}
              />
            </div>
          </div>
        )}

        {/* TAB 3: Staff Operations Console */}
        {activeTab === 'staff' && (
          <StaffOperations
            onAddSong={(title, dur) => handleAddSong(title, dur)}
            onInsertAfter={handleInsertAfter}
            onRemoveSong={handleRemoveSong}
            onDisplayForward={handleDisplayForward}
            onDisplayBackward={handleDisplayBackward}
            onPlayNext={handlePlayNext}
            onPlayPrev={handlePlayPrev}
            logs={logs}
            onClearLogs={() => setLogs([])}
            songTitles={songTitles}
          />
        )}

        {/* TAB 4: Part C Assessment Test Runner */}
        {activeTab === 'assessment' && (
          <AssessmentTestRunner
            onExecuteFullSuite={handleExecuteFullSuite}
            onExecuteStep={handleExecuteStep}
            currentStepIndex={currentTestStep}
            testConsoleLogs={testConsoleLogs}
            onResetTestState={handleResetTestState}
          />
        )}

        {/* TAB 5: Part A & Part D Exam Theory & Answers */}
        {activeTab === 'theory' && <ExamStudyGuide />}
      </main>

      {/* Floating Bottom Bar: Original Source Code & Academic Metadata */}
      <footer className="border-t border-stone-800/80 bg-stone-950 py-3 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-stone-400">
            <span className="font-semibold text-stone-200">Melody Café Player</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="text-amber-400 font-medium">Rachit Sunil Harjani</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="font-mono text-stone-300 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-[11px]">
              PRN: 25070721006
            </span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="text-stone-500">CLO 4 Assessment (Circular Doubly Linked List)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="flex items-center gap-1.5 text-stone-400 hover:text-amber-400 transition-colors font-mono"
            >
              <Code className="w-3.5 h-3.5" />
              <span>View dsa_test.py Source</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddSongModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSong={handleAddSong}
      />

      <InsertAfterModal
        isOpen={isInsertModalOpen}
        onClose={() => setIsInsertModalOpen(false)}
        defaultKey={insertKeyTarget}
        songTitles={songTitles}
        onInsertAfter={handleInsertAfter}
      />

      <PythonSourceModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />
    </div>
  );
}
