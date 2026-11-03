import { SongNode } from '../models/CircularDoublyLinkedList';

export interface AudioEngineCallbacks {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private ambianceGain: GainNode | null = null;

  // Custom audio playback
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  // Synthesized playback state
  private isSynthesizing = false;
  private isPlaying = false;
  private currentSong: SongNode | null = null;
  private currentTime = 0;
  private timerInterval: number | null = null;
  private callbacks: AudioEngineCallbacks = {};

  // Synth scheduling nodes
  private activeVoices: { stop: () => void }[] = [];
  private sequenceStep = 0;
  private sequenceTimer: number | null = null;

  // Café Ambiance
  private isAmbianceActive = false;
  private ambianceNodes: { stop: () => void }[] = [];

  constructor() {
    // Lazy init audio context on first user action
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      this.ambianceGain = this.ctx.createGain();
      this.ambianceGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.ambianceGain.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setCallbacks(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.analyser && (this.ctx || this.isPlaying)) {
      this.initContext();
    }
    return this.analyser;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  private volume = 0.7;

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    const ctx = this.initContext();
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
    }
  }

  public playSong(song: SongNode, startAtSeconds = 0) {
    this.initContext();
    this.stopPlayback(false);

    this.currentSong = song;
    this.currentTime = Math.min(startAtSeconds, song.duration);
    this.isPlaying = true;
    this.callbacks.onPlayStateChange?.(true);

    const streamUrl = song.audioStreamUrl || song.customAudioUrl;
    if (streamUrl) {
      this.playStreamAudio(streamUrl, this.currentTime, song);
    } else {
      this.startSynthesizer(song, this.currentTime);
      this.startTimer(song.duration);
    }
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopPlayback(false); // keep current time
    this.callbacks.onPlayStateChange?.(false);
  }

  public resume() {
    if (!this.currentSong || this.isPlaying) return;
    this.isPlaying = true;
    this.callbacks.onPlayStateChange?.(true);

    if (this.audioElement && (this.currentSong.audioStreamUrl || this.currentSong.customAudioUrl)) {
      this.audioElement.play().catch(() => {});
    } else {
      this.playSong(this.currentSong, this.currentTime);
    }
  }

  public togglePlayPause(currentSong?: SongNode | null) {
    if (this.isPlaying) {
      this.pause();
    } else if (currentSong) {
      if (this.currentSong?.id === currentSong.id && this.audioElement) {
        this.resume();
      } else {
        this.playSong(currentSong, 0);
      }
    }
  }

  public seek(seconds: number) {
    if (!this.currentSong) return;

    const maxDuration = (this.audioElement && !isNaN(this.audioElement.duration) && this.audioElement.duration > 0)
      ? this.audioElement.duration
      : this.currentSong.duration;

    const clamped = Math.max(0, Math.min(seconds, maxDuration));
    this.currentTime = clamped;
    this.callbacks.onTimeUpdate?.(this.currentTime, maxDuration);

    if (this.audioElement && (this.currentSong.audioStreamUrl || this.currentSong.customAudioUrl)) {
      try {
        this.audioElement.currentTime = clamped;
        if (this.isPlaying && this.audioElement.paused) {
          this.audioElement.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Scrubber seek error on audio element:', err);
      }
    } else if (this.isPlaying && this.isSynthesizing) {
      if (this.sequenceTimer) {
        clearInterval(this.sequenceTimer);
        this.sequenceTimer = null;
      }
      this.activeVoices.forEach((v) => v.stop());
      this.activeVoices = [];
      this.startSynthesizer(this.currentSong, clamped);
    }
  }

  private startTimer(duration: number) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = window.setInterval(() => {
      if (!this.isPlaying) return;

      this.currentTime += 0.25;
      if (this.currentTime >= duration) {
        this.currentTime = duration;
        this.callbacks.onTimeUpdate?.(this.currentTime, duration);
        this.handleSongEnd();
      } else {
        this.callbacks.onTimeUpdate?.(this.currentTime, duration);
      }
    }, 250);
  }

  private handleSongEnd() {
    this.stopPlayback(true);
    this.callbacks.onEnded?.();
  }

  private stopPlayback(resetTime = true) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      if (resetTime) {
        this.audioElement.currentTime = 0;
      }
    }

    if (this.sequenceTimer) {
      clearInterval(this.sequenceTimer);
      this.sequenceTimer = null;
    }

    this.activeVoices.forEach((v) => v.stop());
    this.activeVoices = [];
    this.isSynthesizing = false;

    if (resetTime) {
      this.currentTime = 0;
    }
  }

  // --- HTML5 Audio Playback (Full Song from Start to End) ---
  private playStreamAudio(url: string, startTime: number, song: SongNode) {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = this.volume;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        song.duration = Math.round(audio.duration);
        this.callbacks.onTimeUpdate?.(this.currentTime, audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      if (!this.isPlaying) return;
      this.currentTime = audio.currentTime;
      const effectiveDuration = audio.duration && !isNaN(audio.duration) && audio.duration > 0
        ? audio.duration
        : song.duration;
      this.callbacks.onTimeUpdate?.(this.currentTime, effectiveDuration);
    };

    audio.onended = () => {
      this.handleSongEnd();
    };

    audio.onerror = (e) => {
      console.warn('Audio stream error, falling back to procedural synth:', e);
      this.startSynthesizer(song, startTime);
      this.startTimer(song.duration);
    };

    audio.src = url;
    if (startTime > 0) {
      audio.currentTime = startTime;
    }

    this.audioElement = audio;
    audio.play().catch((err) => {
      console.warn('Playback error on audio stream:', err);
    });
  }

  // --- Rich Procedural Synthesizer for Melody Café Tracks ---
  private startSynthesizer(song: SongNode, startTime: number) {
    const ctx = this.initContext();
    this.isSynthesizing = true;
    this.sequenceStep = Math.floor(startTime * 2); // 2 steps per second (120 BPM 8th notes or 60 BPM quarters)

    // Musical themes for practical assessment songs
    const musicalThemes: Record<
      string,
      {
        chords: number[][];
        bassNotes: number[];
        leadScale: number[];
        drumPattern: string;
        tempoMs: number;
        soundStyle: 'warmEp' | 'kalimbaRain' | 'smoothFunk' | 'chillhop' | 'synthwave';
      }
    > = {
      sunrise: {
        // Warm Major 7th Dmaj7 - Gmaj7 - F#m7 - Bm7
        chords: [
          [293.66, 369.99, 440.0, 554.37], // Dmaj7
          [392.0, 493.88, 587.33, 739.99], // Gmaj7
          [369.99, 440.0, 554.37, 659.25], // F#m7
          [246.94, 293.66, 369.99, 440.0],  // Bm7
        ],
        bassNotes: [146.83, 196.0, 185.0, 123.47],
        leadScale: [587.33, 659.25, 739.99, 880.0, 987.77, 1108.73],
        drumPattern: 'kick-snare',
        tempoMs: 380,
        soundStyle: 'warmEp',
      },
      desert_rain: {
        // Atmospheric Modal Em9 - Cmaj7 - Am9 - D9
        chords: [
          [329.63, 392.0, 493.88, 587.33], // Em7
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
          [220.0, 261.63, 329.63, 392.0],  // Am7
          [293.66, 369.99, 440.0, 523.25], // D7
        ],
        bassNotes: [82.41, 65.41, 55.0, 73.42],
        leadScale: [493.88, 587.33, 659.25, 783.99, 880.0, 987.77],
        drumPattern: 'rain-percussion',
        tempoMs: 440,
        soundStyle: 'kalimbaRain',
      },
      marina_lights: {
        // City pop Fmaj7 - Em7 - Dm7 - Cmaj7
        chords: [
          [349.23, 440.0, 523.25, 659.25], // Fmaj7
          [329.63, 392.0, 493.88, 587.33], // Em7
          [293.66, 349.23, 440.0, 523.25], // Dm7
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
        ],
        bassNotes: [87.31, 82.41, 73.42, 65.41],
        leadScale: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5],
        drumPattern: 'city-groove',
        tempoMs: 340,
        soundStyle: 'smoothFunk',
      },
      skyline: {
        // Chillhop Bbmaj7 - Am7 - Gm7 - C7
        chords: [
          [233.08, 293.66, 349.23, 440.0], // Bbmaj7
          [220.0, 261.63, 329.63, 392.0],  // Am7
          [196.0, 233.08, 293.66, 349.23], // Gm7
          [261.63, 329.63, 392.0, 466.16], // C7
        ],
        bassNotes: [116.54, 110.0, 98.0, 130.81],
        leadScale: [466.16, 523.25, 587.33, 698.46, 783.99, 932.33],
        drumPattern: 'chillhop-beat',
        tempoMs: 360,
        soundStyle: 'chillhop',
      },
      night_drive: {
        // Dreamy Synthwave Am - F - C - G
        chords: [
          [220.0, 261.63, 329.63, 440.0], // Am
          [174.61, 220.0, 261.63, 349.23], // F
          [261.63, 329.63, 392.0, 523.25], // C
          [196.0, 246.94, 293.66, 392.0],  // G
        ],
        bassNotes: [55.0, 43.65, 65.41, 49.0],
        leadScale: [440.0, 523.25, 659.25, 783.99, 880.0, 1046.5],
        drumPattern: 'synthwave-pulse',
        tempoMs: 310,
        soundStyle: 'synthwave',
      },
    };

    const themeKey = song.moodTheme === 'custom' ? this.hashTitleToTheme(song.title) : song.moodTheme;
    const theme = musicalThemes[themeKey] || musicalThemes.sunrise;

    const playStep = () => {
      if (!this.isPlaying || !this.isSynthesizing || !this.ctx) return;

      const step = this.sequenceStep;
      const chordIndex = Math.floor(step / 8) % theme.chords.length;
      const currentChord = theme.chords[chordIndex];
      const bassFreq = theme.bassNotes[chordIndex];

      // 1. Trigger chord pad on step % 8 === 0 (downbeat of bar)
      if (step % 8 === 0) {
        this.playChordPad(currentChord, (theme.tempoMs * 7.5) / 1000, theme.soundStyle);
        this.playBassNote(bassFreq, (theme.tempoMs * 3.8) / 1000, theme.soundStyle);
      } else if (step % 8 === 4) {
        this.playBassNote(bassFreq * 1.5, (theme.tempoMs * 3.0) / 1000, theme.soundStyle);
      }

      // 2. Play gentle arpeggiated melodic notes
      if (step % 2 === 0 || Math.random() > 0.4) {
        const noteIndex = (step * 3 + chordIndex * 2) % theme.leadScale.length;
        const noteFreq = theme.leadScale[noteIndex];
        this.playMelodicNote(noteFreq, (theme.tempoMs * 1.5) / 1000, theme.soundStyle);
      }

      // 3. Lo-fi café drums (subtle kick & brush snare/snap)
      if (step % 4 === 0) {
        this.playLofiKick();
      } else if (step % 4 === 2) {
        this.playLofiSnare();
      } else if (step % 2 === 1) {
        this.playLofiHiHat();
      }

      this.sequenceStep++;
    };

    // Immediate first beat
    playStep();
    this.sequenceTimer = window.setInterval(playStep, theme.tempoMs);
  }

  private hashTitleToTheme(title: string): string {
    const themes = ['sunrise', 'desert_rain', 'marina_lights', 'skyline', 'night_drive'];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
    }
    return themes[Math.abs(hash) % themes.length];
  }

  // --- Synth Voices ---
  private playChordPad(chord: number[], duration: number, style: string) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    chord.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = style === 'synthwave' ? 'sawtooth' : style === 'kalimbaRain' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(style === 'synthwave' ? 900 : 700, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  private playBassNote(freq: number, duration: number, style: string) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = style === 'synthwave' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playMelodicNote(freq: number, duration: number, style: string) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = style === 'kalimbaRain' ? 'sine' : style === 'warmEp' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playLofiKick() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playLofiSnare() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Filtered noise for rim/snap
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  private playLofiHiHat() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // --- Cozy Melody Café Ambiance Layer ---
  public toggleAmbiance(): boolean {
    const ctx = this.initContext();
    this.isAmbianceActive = !this.isAmbianceActive;

    if (!this.isAmbianceActive) {
      this.ambianceNodes.forEach((n) => n.stop());
      this.ambianceNodes = [];
      return false;
    }

    // Generate gentle rain on café window + vinyl crackle
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Pinkish noise
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;

    noise.connect(filter);
    if (this.ambianceGain) {
      filter.connect(this.ambianceGain);
    }
    noise.start();

    this.ambianceNodes.push({
      stop: () => {
        try {
          noise.stop();
        } catch {
          // ignore
        }
      },
    });

    return true;
  }

  public getAmbianceState(): boolean {
    return this.isAmbianceActive;
  }
}

export const audioEngine = new AudioEngine();
