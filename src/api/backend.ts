import type { Track } from '../data/tracks';

export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://aura-backend-gs61.onrender.com');
import { supabase } from '../lib/supabase';

export const getDeviceId = () => {
  let id = localStorage.getItem('aura_device_id');
  if (!id) { id = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('aura_device_id', id); }
  return id;
};

export async function apiFetch(url: string | URL | Request, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { ...((options.headers as Record<string, string>) || {}) };
  if (session) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  headers['X-Device-ID'] = getDeviceId();
  return fetch(url, { ...options, headers });
}


export async function searchTracks(query: string): Promise<Track[]> {
  try {
    const res = await apiFetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    
    // The backend already formats it mostly like Track, but let's ensure URL is handled later
    // because URL requires a secondary fetch to /stream. We can set it to empty initially.
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      coverArt: item.coverArt,
      url: '' // We will fetch the stream URL when the user clicks play
    }));
  } catch (error) {
    console.error('Error fetching tracks from backend:', error);
    return [];
  }
}

export async function getNewReleases(): Promise<Track[]> {
  // YT Music doesn't have a direct "new releases" via search easily, so we search a generic popular term
  const queries = ['top hits 2024', 'viral songs', 'new music pop'];
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];
  return searchTracks(randomQuery);
}

export const removeLikedSong = async (videoId: string): Promise<void> => {
  const deviceId = getDeviceId();
  await apiFetch(`${API_BASE}/like/${videoId}`, {
    method: 'DELETE',
    headers: {
      'X-Device-ID': deviceId
    }
  });
};

// --- PLAYLIST APIs ---
export const getPlaylists = async () => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/playlists`, {
    headers: { 'X-Device-ID': deviceId }
  });
  return res.json();
};

export const createPlaylist = async (name: string) => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/playlists`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return res.json();
};

export const getPlaylistTracks = async (playlistId: number) => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/playlists/${playlistId}`, {
    headers: { 'X-Device-ID': deviceId }
  });
  return res.json();
};

export const addTrackToPlaylist = async (playlistId: number, track: Track) => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: track.id,
      title: track.title,
      artist: track.artist,
      coverArt: track.coverArt,
      duration: (track as any).duration
    })
  });
  return res.json();
};

// --- ALBUM APIs ---
export const getSavedAlbums = async () => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/albums`, {
    headers: { 'X-Device-ID': deviceId }
  });
  return res.json();
};

export const saveAlbum = async (album: any) => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/albums`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId, 'Content-Type': 'application/json' },
    body: JSON.stringify(album)
  });
  return res.json();
};

export const removeSavedAlbum = async (browseId: string) => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/albums/${browseId}`, {
    method: 'DELETE',
    headers: { 'X-Device-ID': deviceId }
  });
  return res.json();
};

// --- ARTIST APIs ---
export const getFollowedArtists = async () => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/artists/followed`, {
    headers: { 'X-Device-ID': deviceId }
  });
  return res.json();
};

export const followArtist = async (artist: any) => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/artists/follow`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId, 'Content-Type': 'application/json' },
    body: JSON.stringify(artist)
  });
  return res.json();
};

export const unfollowArtist = async (browseId: string) => {
  const deviceId = getDeviceId();
  const res = await apiFetch(`${API_BASE}/artists/follow/${browseId}`, {
    method: 'DELETE',
    headers: { 'X-Device-ID': deviceId }
  });
  return res.json();
};

// getStreamUrl: calls our backend which internally tries pytubefix → Piped API
// All fallback logic is server-side to avoid browser CORS restrictions.
export const getStreamUrl = async (videoId: string): Promise<string | null> => {
  try {
    const res = await apiFetch(`${API_BASE}/stream/url?video_id=${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
    console.warn('Backend returned non-ok for stream/url:', res.status);
  } catch (e) {
    console.error('getStreamUrl failed:', e);
  }
  return null;
};

export async function getBackendLyrics(videoId: string): Promise<string> {
  try {
    const res = await apiFetch(`${API_BASE}/lyrics?video_id=${encodeURIComponent(videoId)}`);
    if (!res.ok) throw new Error('Failed to get lyrics');
    const data = await res.json();
    return data.lyrics;
  } catch (error) {
    return 'Lyrics not available.';
  }
}

export async function getExplore(): Promise<Track[]> {
  try {
    const res = await apiFetch(`${API_BASE}/explore`);
    if (!res.ok) throw new Error('Failed to fetch explore');
    const data = await res.json();
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      coverArt: item.coverArt,
      url: ''
    }));
  } catch (error) {
    console.error('Error fetching explore tracks:', error);
    return [];
  }
}

export async function getArtist(artistName: string): Promise<any> {
  try {
    const res = await apiFetch(`${API_BASE}/artist?artist_name=${encodeURIComponent(artistName)}`);
    if (!res.ok) throw new Error('Failed to fetch artist');
    return await res.json();
  } catch (error) {
    console.error('Error fetching artist details:', error);
    return null;
  }
}



// --- PODCASTS ---
export const getPodcasts = async () => {
  const res = await apiFetch(`${API_BASE}/podcasts`, { headers: { 'X-Device-ID': getDeviceId() } });
  return res.json();
};

export const addPodcast = async (rss_url: string) => {
  const res = await apiFetch(`${API_BASE}/podcasts`, {
    method: 'POST',
    headers: { 'X-Device-ID': getDeviceId(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ rss_url })
  });
  return res.json();
};

// --- SMART PLAYLIST ---
export const createSmartPlaylist = async (data: { name: string; mood?: string; genre?: string; artist?: string; limit?: number }) => {
  const res = await apiFetch(`${API_BASE}/smart-playlist`, {
    method: 'POST',
    headers: { 'X-Device-ID': getDeviceId(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

// --- METADATA ---
export const getTrackMetadata = async (title: string, artist: string) => {
  const res = await apiFetch(`${API_BASE}/metadata?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
  return res.json();
};

// --- SIMILAR ARTISTS ---
export const getSimilarArtists = async (artistName: string) => {
  const res = await apiFetch(`${API_BASE}/artist/similar?artist_name=${encodeURIComponent(artistName)}`);
  return res.json();
};

// --- SPOTIFY IMPORT ---
export const importSpotifyPlaylist = async (url: string) => {
  const res = await apiFetch(`${API_BASE}/import/spotify?url=${encodeURIComponent(url)}`, {
    headers: { 'X-Device-ID': getDeviceId() }
  });
  return res.json();
};

// --- PROFILE ---
export const getProfile = async () => {
  const res = await apiFetch(`${API_BASE}/profile`, { headers: { 'X-Device-ID': getDeviceId() } });
  return res.json();
};

export const updateProfile = async (data: { name?: string; avatar?: string }) => {
  const res = await apiFetch(`${API_BASE}/profile`, {
    method: 'PATCH',
    headers: { 'X-Device-ID': getDeviceId(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

// --- LISTENING SESSION ---
export const createSession = async () => {
  const res = await apiFetch(`${API_BASE}/sessions/create`, {
    method: 'POST',
    headers: { 'X-Device-ID': getDeviceId() }
  });
  return res.json();
};
