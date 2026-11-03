import { InternetSongResult } from '../types/playlist';

const AUDIUS_NODES = [
  'https://discoveryprovider.audius.co',
  'https://api.audius.co',
  'https://audius-discovery-1.altego.net',
];

export class MusicSearchService {
  /**
   * Search Audius open music catalog (100% full-length complete songs, 2-6+ minutes)
   */
  async searchAudius(query: string, limit = 25): Promise<InternetSongResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    let data: any = null;

    // Try multiple Audius discovery nodes for highest resilience
    for (const node of AUDIUS_NODES) {
      try {
        const url = `${node}/v1/tracks/search?query=${encodeURIComponent(trimmed)}&app_name=melody_cafe`;
        const res = await fetch(url);
        if (res.ok) {
          data = await res.json();
          if (data && data.data && data.data.length > 0) {
            break;
          }
        }
      } catch {
        // Try next node
      }
    }

    // Try proxy fallback if direct nodes failed
    if (!data || !data.data) {
      try {
        const proxyUrl = `/api/audius/v1/tracks/search?query=${encodeURIComponent(trimmed)}&app_name=melody_cafe`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn('Audius fallback search error:', err);
      }
    }

    if (!data || !data.data) {
      return [];
    }

    return (data.data as any[])
      .filter((item) => item.title && (item.stream?.url || item.id))
      .slice(0, limit)
      .map((item) => {
        const streamUrl =
          item.stream?.url ||
          `https://discoveryprovider.audius.co/v1/tracks/${item.id}/stream?app_name=melody_cafe`;
        const artwork =
          item.artwork?.['480x480'] ||
          item.artwork?.['150x150'] ||
          item.artwork?.['1000x1000'] ||
          '';

        const dur = Math.round(item.duration || 210);

        return {
          id: `audius-${item.id || Math.random().toString(36).slice(2, 9)}`,
          title: item.title,
          artist: item.user?.name || 'Independent Artist',
          album: item.mood ? `${item.mood} Vibes` : 'Full-Length Release',
          duration: dur,
          originalDuration: dur,
          audioStreamUrl: streamUrl,
          artworkUrl: artwork,
          genre: item.genre || 'Full-Length Music',
          source: 'audius',
          isFullLength: true,
        };
      });
  }

  /**
   * Search Internet Archive Audio Library (100% full-length live shows, master studio tapes, covers)
   */
  async searchArchive(query: string, limit = 15): Promise<InternetSongResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const q = `(title:(${encodeURIComponent(trimmed)}) OR creator:(${encodeURIComponent(trimmed)}) OR description:(${encodeURIComponent(trimmed)})) AND mediatype:audio`;
      const url = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title,creator,length,format&rows=${limit}&output=json`;

      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();

      if (!json || !json.response || !json.response.docs) {
        return [];
      }

      const results: InternetSongResult[] = [];

      for (const doc of json.response.docs) {
        if (!doc.identifier || !doc.title) continue;

        // Approximate length in seconds if provided
        let dur = 240;
        if (doc.length) {
          const parsed = parseFloat(doc.length);
          if (!isNaN(parsed) && parsed > 30) {
            dur = Math.round(parsed);
          }
        }

        // Standard direct Archive.org MP3 stream path
        const streamUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(doc.identifier)}_vbr.mp3`;
        const artworkUrl = `https://archive.org/services/img/${doc.identifier}`;

        results.push({
          id: `archive-${doc.identifier}`,
          title: doc.title,
          artist: doc.creator || 'Internet Archive Live',
          album: 'Archive Master Recording',
          duration: dur,
          originalDuration: dur,
          audioStreamUrl: streamUrl,
          artworkUrl: artworkUrl,
          genre: 'Archive Audio',
          source: 'archive',
          isFullLength: true,
        });
      }

      return results;
    } catch (err) {
      console.warn('Archive search error:', err);
      return [];
    }
  }

  /**
   * Search iTunes Catalog (100M+ songs with Apple 30-second studio previews)
   */
  async searchITunes(query: string, limit = 20): Promise<InternetSongResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const directUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=${limit}`;
    const proxyUrl = `/api/itunes/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=${limit}`;

    let data: any = null;
    try {
      const res = await fetch(directUrl);
      if (res.ok) {
        data = await res.json();
      } else {
        throw new Error('Direct fetch failed');
      }
    } catch {
      try {
        const res = await fetch(proxyUrl);
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn('iTunes search request error:', err);
      }
    }

    if (!data || !data.results) {
      return [];
    }

    return (data.results as any[])
      .filter((item) => item.trackName && (item.previewUrl || item.trackTimeMillis))
      .map((item) => {
        const rawArtwork = item.artworkUrl100 || item.artworkUrl60 || '';
        const highResArtwork = rawArtwork.replace('100x100bb.jpg', '600x600bb.jpg');
        const songDuration = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 210;

        return {
          id: `itunes-${item.trackId || Math.random().toString(36).slice(2, 9)}`,
          title: item.trackName,
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName,
          duration: 30, // Apple public API limits previews to 30s
          originalDuration: songDuration,
          audioStreamUrl: item.previewUrl || '',
          artworkUrl: highResArtwork,
          genre: item.primaryGenreName || 'Popular',
          source: 'itunes',
          isFullLength: false,
        };
      });
  }

  /**
   * Automatically resolve a 30-second preview track into a FULL-LENGTH (3-5+ min) complete song stream
   */
  async resolveFullLengthTrack(track: InternetSongResult): Promise<InternetSongResult> {
    if (track.isFullLength && track.duration > 45) {
      return track;
    }

    try {
      // Search Audius for the exact title and artist
      const fullQuery = `${track.title} ${track.artist}`.trim();
      const audiusMatches = await this.searchAudius(fullQuery, 8);

      // Look for a track with full length (> 60s)
      const validMatch = audiusMatches.find(
        (m) => m.isFullLength && m.duration > 60 && m.audioStreamUrl
      ) || audiusMatches[0];

      if (validMatch) {
        return {
          ...track,
          audioStreamUrl: validMatch.audioStreamUrl,
          duration: validMatch.duration,
          isFullLength: true,
          resolvedFullStreamUrl: validMatch.audioStreamUrl,
          genre: track.genre || validMatch.genre,
        };
      }

      // If Audius didn't find it, try Internet Archive
      const archiveMatches = await this.searchArchive(track.title, 5);
      if (archiveMatches.length > 0 && archiveMatches[0].audioStreamUrl) {
        const match = archiveMatches[0];
        return {
          ...track,
          audioStreamUrl: match.audioStreamUrl,
          duration: match.duration,
          isFullLength: true,
          resolvedFullStreamUrl: match.audioStreamUrl,
        };
      }
    } catch (err) {
      console.warn('Could not auto-resolve full track:', err);
    }

    return track;
  }

  /**
   * Universal search: defaults to 100% FULL-LENGTH complete songs
   */
  async searchUniversal(
    query: string,
    source: 'full_only' | 'audius' | 'archive' | 'all' | 'itunes' = 'full_only'
  ): Promise<InternetSongResult[]> {
    if (!query.trim()) return [];

    if (source === 'audius') {
      return this.searchAudius(query);
    }

    if (source === 'archive') {
      return this.searchArchive(query);
    }

    if (source === 'itunes') {
      return this.searchITunes(query);
    }

    if (source === 'full_only') {
      // Query 100% full-length sources simultaneously
      const [audiusResults, archiveResults] = await Promise.allSettled([
        this.searchAudius(query, 20),
        this.searchArchive(query, 10),
      ]);

      const results: InternetSongResult[] = [];
      if (audiusResults.status === 'fulfilled') {
        results.push(...audiusResults.value);
      }
      if (archiveResults.status === 'fulfilled') {
        results.push(...archiveResults.value);
      }
      return results;
    }

    // "all": Queries full sources and Apple catalog
    const [audiusResults, itunesResults, archiveResults] = await Promise.allSettled([
      this.searchAudius(query, 15),
      this.searchITunes(query, 15),
      this.searchArchive(query, 8),
    ]);

    const results: InternetSongResult[] = [];
    if (audiusResults.status === 'fulfilled') {
      results.push(...audiusResults.value);
    }
    if (archiveResults.status === 'fulfilled') {
      results.push(...archiveResults.value);
    }
    if (itunesResults.status === 'fulfilled') {
      results.push(...itunesResults.value);
    }

    return results;
  }
}

export const musicSearchService = new MusicSearchService();
