import { SongData, NodeSnapshot } from '../types/playlist';

export class SongNode {
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
  sourceCatalog?: 'itunes' | 'audius' | 'archive' | 'custom' | 'synth';
  coverGradient?: string;
  next: SongNode;
  prev: SongNode;

  constructor(
    title: string,
    duration: number,
    metadata?: Partial<Omit<SongData, 'title' | 'duration'>>
  ) {
    this.id = metadata?.id || `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.title = title.trim();
    this.duration = Math.max(1, Math.round(duration));
    this.artist = metadata?.artist || 'Melody Café Resident';
    this.genre = metadata?.genre || 'Café Lo-Fi';
    this.moodTheme = metadata?.moodTheme || this.inferMoodTheme(title);
    this.bpm = metadata?.bpm || 78;
    this.customAudioUrl = metadata?.customAudioUrl;
    this.audioStreamUrl = metadata?.audioStreamUrl;
    this.albumArtUrl = metadata?.albumArtUrl;
    this.sourceCatalog = metadata?.sourceCatalog || (metadata?.audioStreamUrl ? 'itunes' : 'synth');
    this.coverGradient = metadata?.coverGradient || this.inferGradient(this.moodTheme);

    // Circular pointer initialization (self-referencing single node)
    this.next = this;
    this.prev = this;
  }

  private inferMoodTheme(title: string): 'sunrise' | 'desert_rain' | 'marina_lights' | 'skyline' | 'night_drive' | 'custom' {
    const t = title.toLowerCase();
    if (t.includes('sunrise')) return 'sunrise';
    if (t.includes('desert') || t.includes('rain')) return 'desert_rain';
    if (t.includes('marina') || t.includes('lights') || t.includes('light')) return 'marina_lights';
    if (t.includes('skyline')) return 'skyline';
    if (t.includes('night') || t.includes('drive')) return 'night_drive';
    return 'custom';
  }

  private inferGradient(theme: string): string {
    switch (theme) {
      case 'sunrise':
        return 'from-amber-500 via-orange-500 to-rose-600';
      case 'desert_rain':
        return 'from-cyan-600 via-teal-700 to-emerald-800';
      case 'marina_lights':
        return 'from-blue-600 via-indigo-600 to-violet-800';
      case 'skyline':
        return 'from-amber-600 via-pink-600 to-purple-800';
      case 'night_drive':
        return 'from-indigo-800 via-purple-900 to-stone-900';
      default:
        return 'from-stone-700 via-amber-800 to-stone-900';
    }
  }
}

export class CircularDoublyLinkedList {
  head: SongNode | null = null;
  private _version = 0; // for triggering react updates

  constructor() {
    this.head = null;
  }

  get version(): number {
    return this._version;
  }

  private mutate(): void {
    this._version++;
  }

  /**
   * Helper: find first song with this title, or null
   * Direct parity with Python Playlist.find()
   */
  find(title: string): SongNode | null {
    if (this.head === null) {
      return null;
    }
    const target = title.trim().toLowerCase();
    let cur = this.head;
    while (true) {
      if (cur.title.toLowerCase() === target) {
        return cur;
      }
      cur = cur.next;
      if (cur === this.head) {
        return null;
      }
    }
  }

  /**
   * B(a) addSong: add at the end
   * Direct parity with Python Playlist.addSong()
   */
  addSong(
    title: string,
    duration: number,
    metadata?: Partial<Omit<SongData, 'title' | 'duration'>>
  ): SongNode {
    const node = new SongNode(title, duration, metadata);
    if (this.head === null) {
      // Empty playlist
      this.head = node;
    } else {
      const tail = this.head.prev;
      node.prev = tail;
      node.next = this.head;
      tail.next = node;
      this.head.prev = node;
    }
    this.mutate();
    return node;
  }

  /**
   * B(b) insertAfter
   * Inserts a new song immediately after the song named key.
   * Direct parity with Python Playlist.insertAfter()
   */
  insertAfter(
    key: string,
    title: string,
    duration: number,
    metadata?: Partial<Omit<SongData, 'title' | 'duration'>>
  ): { success: boolean; node?: SongNode; message: string } {
    const k = this.find(key);
    if (k === null) {
      const msg = `Song '${key}' not found. Cannot insert '${title}'.`;
      return { success: false, message: msg };
    }
    const node = new SongNode(title, duration, metadata);
    node.prev = k;
    node.next = k.next;
    k.next.prev = node;
    k.next = node;
    this.mutate();
    return {
      success: true,
      node,
      message: `Inserted '${title}' immediately after '${k.title}'.`,
    };
  }

  /**
   * B(c) removeSong
   * Removes the first song with this title.
   * Direct parity with Python Playlist.removeSong()
   */
  removeSong(title: string): { success: boolean; removedNode?: SongNode; message: string } {
    const node = this.find(title);
    if (node === null) {
      const msg = `Song '${title}' not found. Nothing removed.`;
      return { success: false, message: msg };
    }

    if (node.next === node) {
      // Only song in the playlist
      this.head = null;
    } else {
      node.prev.next = node.next;
      node.next.prev = node.prev;
      if (node === this.head) {
        // Removing the first song
        this.head = node.next;
      }
    }
    this.mutate();
    return {
      success: true,
      removedNode: node,
      message: `Removed: ${title}`,
    };
  }

  /**
   * B(d) displayForward
   * Returns list of titles from the first song to the last song.
   * Direct parity with Python Playlist.displayForward()
   */
  displayForward(): string[] {
    if (this.head === null) {
      return [];
    }
    const titles: string[] = [];
    let cur = this.head;
    while (true) {
      titles.push(cur.title);
      cur = cur.next;
      if (cur === this.head) {
        break;
      }
    }
    return titles;
  }

  /**
   * B(d) displayBackward
   * Returns list of titles from the last song to the first song.
   * Direct parity with Python Playlist.displayBackward()
   */
  displayBackward(): string[] {
    if (this.head === null) {
      return [];
    }
    const titles: string[] = [];
    const tail = this.head.prev;
    let cur = tail;
    while (true) {
      titles.push(cur.title);
      cur = cur.prev;
      if (cur === tail) {
        break;
      }
    }
    return titles;
  }

  /**
   * B(e) playNext
   * Returns the song after current. Circular: last -> first.
   * Direct parity with Python Playlist.playNext()
   */
  playNext(current: SongNode | null): SongNode | null {
    if (current === null) {
      return null;
    }
    return current.next;
  }

  /**
   * Staff helper: playPrev
   * Returns the song before current. Circular: first -> last.
   */
  playPrev(current: SongNode | null): SongNode | null {
    if (current === null) {
      return null;
    }
    return current.prev;
  }

  /**
   * Count total songs
   */
  size(): number {
    if (this.head === null) return 0;
    let count = 0;
    let cur = this.head;
    while (true) {
      count++;
      cur = cur.next;
      if (cur === this.head) break;
    }
    return count;
  }

  isEmpty(): boolean {
    return this.head === null;
  }

  /**
   * Get total duration in seconds
   */
  getTotalDuration(): number {
    if (this.head === null) return 0;
    let total = 0;
    let cur = this.head;
    while (true) {
      total += cur.duration;
      cur = cur.next;
      if (cur === this.head) break;
    }
    return total;
  }

  /**
   * Clear all songs
   */
  clear(): void {
    this.head = null;
    this.mutate();
  }

  /**
   * Returns linear array snapshot of nodes with metadata for UI rendering
   */
  toNodeArray(currentSongId?: string): NodeSnapshot[] {
    if (this.head === null) return [];
    const result: NodeSnapshot[] = [];
    const tail = this.head.prev;
    let cur = this.head;
    let index = 0;

    while (true) {
      result.push({
        id: cur.id,
        title: cur.title,
        duration: cur.duration,
        artist: cur.artist,
        genre: cur.genre,
        moodTheme: cur.moodTheme,
        albumArtUrl: cur.albumArtUrl,
        audioStreamUrl: cur.audioStreamUrl,
        sourceCatalog: cur.sourceCatalog,
        isHead: cur === this.head,
        isTail: cur === tail,
        isCurrent: cur.id === currentSongId,
        nextTitle: cur.next.title,
        prevTitle: cur.prev.title,
        nextId: cur.next.id,
        prevId: cur.prev.id,
        index,
      });
      index++;
      cur = cur.next;
      if (cur === this.head) break;
    }
    return result;
  }
}
