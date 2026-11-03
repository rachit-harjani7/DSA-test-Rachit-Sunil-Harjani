export interface SongData {
  id: string;
  title: string;
  duration: number; // in seconds
  artist: string;
  genre: string;
  moodTheme: 'sunrise' | 'desert_rain' | 'marina_lights' | 'skyline' | 'night_drive' | 'custom';
  bpm?: number;
  customAudioUrl?: string;
  audioStreamUrl?: string;
  albumArtUrl?: string;
  coverGradient?: string;
  sourceCatalog?: 'itunes' | 'audius' | 'archive' | 'custom' | 'synth';
}

export interface NodeSnapshot {
  id: string;
  title: string;
  duration: number;
  artist: string;
  genre: string;
  moodTheme: string;
  albumArtUrl?: string;
  audioStreamUrl?: string;
  sourceCatalog?: string;
  isHead: boolean;
  isTail: boolean;
  isCurrent: boolean;
  nextTitle: string;
  prevTitle: string;
  nextId: string;
  prevId: string;
  index: number;
}

export interface InternetSongResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  audioStreamUrl: string;
  artworkUrl?: string;
  genre: string;
  source: 'audius' | 'archive' | 'itunes';
  isFullLength?: boolean;
  resolvedFullStreamUrl?: string;
  originalDuration?: number;
}

export interface TestStep {
  stepNumber: number;
  title: string;
  actionDescription: string;
  codeSnippet: string;
  expectedOutput: string[];
}

export interface OperationLog {
  id: string;
  timestamp: string;
  type: 'add' | 'insert' | 'remove' | 'display' | 'play' | 'test' | 'error';
  message: string;
  details?: string;
}
