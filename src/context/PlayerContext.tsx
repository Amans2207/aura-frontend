// @ts-nocheck
import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { Track } from '../data/tracks';
// @ts-ignore
import { getColorSync, getPaletteSync } from 'colorthief';
import YouTube from 'react-youtube';
import {
  startBackgroundKeepAlive,
  stopBackgroundKeepAlive,
  updateMediaSession,
  setMediaSessionPlayback,
  updateMediaSessionPosition,
  showTrackNotification
} from '../services/backgroundAudio';

export type RepeatMode = 'none' | 'one' | 'all';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  bass: number; mid: number; treble: number; pan: number;
  pitch: number;
  replayGain: boolean;
  queue: Track[];
  shuffle: boolean;
  repeat: RepeatMode;
  recentlyPlayed: Track[];
  crossfadeDuration: number;
  showQueue: boolean;
  showFullScreen: boolean;
  showShortcuts: boolean;
  showLyrics: boolean;
  showMiniPlayer: boolean;
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolumeLevel: (vol: number) => void;
  setBass: (val: number) => void;
  setMid: (val: number) => void;
  setTreble: (val: number) => void;
  setPan: (val: number) => void;
  setPitch: (val: number) => void;
  setReplayGain: (val: boolean) => void;
  getFrequencyData: () => Uint8Array | null;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrev: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCrossfadeDuration: (sec: number) => void;
  setShowQueue: (v: boolean) => void;
  setShowFullScreen: (v: boolean) => void;
  setShowShortcuts: (v: boolean) => void;
  setShowLyrics: (v: boolean) => void;
  setShowMiniPlayer: (v: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// --- LocalStorage helpers for recently played ---
const RECENT_KEY = 'aura_recently_played';
const loadRecent = (): Track[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const saveRecent = (tracks: Track[]) => {
  localStorage.setItem(RECENT_KEY, JSON.stringify(tracks.slice(0, 50)));
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [bass, setBassState] = useState(0);
  const [mid, setMidState] = useState(0);
  const [treble, setTrebleState] = useState(0);
  const [pan, setPanState] = useState(0);
  const [pitch, setPitchState] = useState(0);
  const [replayGain, setReplayGainState] = useState(false);

  // Queue, shuffle, repeat
  const [queue, setQueue] = useState<Track[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('none');
  const [history, setHistory] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(loadRecent());
  const [crossfadeDuration, setCrossfadeDurationState] = useState(3);

  // UI panels
  const [showQueue, setShowQueue] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  const youtubePlayerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadeTimerRef = useRef<any>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>('none');
  const historyRef = useRef<Track[]>([]);

  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { historyRef.current = history; }, [history]);

  // --- Dynamic Theme ---
  useEffect(() => {
    if (currentTrack?.coverArt) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = currentTrack.coverArt;
      img.onload = () => {
        try {
          const color = getColorSync(img);
          const palette = getPaletteSync(img, { colorCount: 3 });
          if (color && palette) {
            document.documentElement.style.setProperty('--accent-primary', `rgb(${color[0]},${color[1]},${color[2]})`);
            document.documentElement.style.setProperty('--accent-secondary', `rgb(${palette[1][0]},${palette[1][1]},${palette[1][2]})`);
            document.body.style.backgroundImage = `
              radial-gradient(circle at 10% 20%, rgba(${color[0]},${color[1]},${color[2]},0.3) 0%, transparent 40%),
              radial-gradient(circle at 90% 80%, rgba(${palette[1][0]},${palette[1][1]},${palette[1][2]},0.3) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(${palette[2][0]},${palette[2][1]},${palette[2][2]},0.3) 0%, transparent 50%)
            `;
          }
        } catch {}
      };
    }
  }, [currentTrack]);

  // --- Recently Played ---
  const addToRecent = useCallback((track: Track) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 50);
      saveRecent(updated);
      return updated;
    });
    // OS notification
    showTrackNotification({ title: track.title, artist: track.artist, coverArt: track.coverArt });
    // Also log to backend for Discover Weekly + scrobble
    try {
      const { getDeviceId } = require('../api/backend');
      const deviceId = getDeviceId();
      fetch(`http://localhost:8000/recent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-ID': deviceId },
        body: JSON.stringify({ id: track.id, title: track.title, artist: track.artist, coverArt: track.coverArt, duration: (track as any).duration || '0:00' })
      }).catch(() => {});
      // Last.fm scrobble
      fetch(`http://localhost:8000/scrobble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-ID': deviceId },
        body: JSON.stringify({ title: track.title, artist: track.artist, duration: 180 })
      }).catch(() => {});
    } catch {}
  }, []);

  // --- Pick next track (shuffle/repeat aware) ---
  const pickNextTrack = useCallback(async (): Promise<Track | null> => {
    const q = queueRef.current;
    const track = currentTrackRef.current;

    // If queue has items, pop first
    if (q.length > 0) {
      const next = q[0];
      setQueue(prev => prev.slice(1));
      return next;
    }

    // Repeat one
    if (repeatRef.current === 'one' && track) return track;

    // Radio: fetch similar
    try {
      const { searchTracks } = await import('../api/backend');
      if (track) {
        const similar = await searchTracks(track.artist);
        const candidates = similar.filter(t => t.id !== track.id);
        if (candidates.length > 0) {
          if (shuffleRef.current) {
            return candidates[Math.floor(Math.random() * candidates.length)];
          }
          return candidates[0];
        }
      }
    } catch {}
    return null;
  }, []);

  // --- Crossfade logic ---
  const startCrossfade = useCallback((nextTrack: Track) => {
    if (!youtubePlayerRef.current || crossfadeDuration === 0) {
      setCurrentTrack(nextTrack);
      return;
    }
    const steps = 20;
    const interval = (crossfadeDuration * 1000) / steps;
    let step = 0;
    clearInterval(crossfadeTimerRef.current);
    crossfadeTimerRef.current = setInterval(() => {
      step++;
      const vol = Math.max(0, volume * (1 - step / steps));
      try { youtubePlayerRef.current?.setVolume(vol); } catch {}
      if (step >= steps) {
        clearInterval(crossfadeTimerRef.current);
        setCurrentTrack(nextTrack);
        setTimeout(() => {
          try { youtubePlayerRef.current?.setVolume(volume); } catch {}
        }, 500);
      }
    }, interval);
  }, [crossfadeDuration, volume]);

  // --- Handle song ended ---
  const handleEnded = useCallback(async () => {
    setIsPlaying(false);
    setProgress(0);
    const next = await pickNextTrack();
    if (next) {
      startCrossfade(next);
    }
  }, [pickNextTrack, startCrossfade]);

  // --- Play Track ---
  const playTrack = useCallback((track: Track) => {
    if (currentTrackRef.current?.id === track.id) {
      togglePlayPause();
      return;
    }
    addToRecent(track);

    // Save current to history
    if (currentTrackRef.current) {
      setHistory(prev => [currentTrackRef.current!, ...prev].slice(0, 50));
    }

    setCurrentTrack(track);

    // Start background keep-alive for mobile
    startBackgroundKeepAlive();

    // Update MediaSession
    updateMediaSession(
      { title: track.title, artist: track.artist, coverArt: track.coverArt },
      {
        play: () => { youtubePlayerRef.current?.playVideo(); setIsPlaying(true); },
        pause: () => { youtubePlayerRef.current?.pauseVideo(); setIsPlaying(false); },
        next: playNext,
        prev: playPrev,
        seekTo: (d) => { if (d.seekTime != null) seek(d.seekTime); },
      }
    );

    // Handle local file
    if ((track as any).isLocal && (track as any).localUrl) {
      try { youtubePlayerRef.current?.stopVideo(); } catch {}
      if (!localAudioRef.current) localAudioRef.current = new Audio();
      const audio = localAudioRef.current;
      audio.src = (track as any).localUrl;
      audio.volume = volume / 100;
      audio.onloadedmetadata = () => setDuration(audio.duration || 0);
      audio.ontimeupdate = () => setProgress(audio.currentTime);
      audio.onended = handleEnded;
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [addToRecent, handleEnded, volume]);

  // --- Play Next / Prev ---
  const playNext = useCallback(async () => {
    const next = await pickNextTrack();
    if (next) startCrossfade(next);
  }, [pickNextTrack, startCrossfade]);

  const playPrev = useCallback(() => {
    // If > 3s in, restart
    if (progress > 3) {
      seek(0);
      return;
    }
    const h = historyRef.current;
    if (h.length > 0) {
      const prev = h[0];
      setHistory(p => p.slice(1));
      setCurrentTrack(prev);
    }
  }, [progress]);

  // --- togglePlayPause ---
  const togglePlayPause = useCallback(() => {
    // Local file
    if (currentTrackRef.current && (currentTrackRef.current as any).isLocal && localAudioRef.current) {
      if (localAudioRef.current.paused) {
        localAudioRef.current.play().then(() => { setIsPlaying(true); setMediaSessionPlayback('playing'); startBackgroundKeepAlive(); }).catch(console.error);
      } else {
        localAudioRef.current.pause();
        setIsPlaying(false);
        setMediaSessionPlayback('paused');
      }
      return;
    }
    if (youtubePlayerRef.current && currentTrackRef.current) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
        setIsPlaying(false);
        setMediaSessionPlayback('paused');
        stopBackgroundKeepAlive();
      } else {
        youtubePlayerRef.current.playVideo();
        setIsPlaying(true);
        setMediaSessionPlayback('playing');
        startBackgroundKeepAlive();
      }
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(time, true);
      setProgress(time);
    }
    if (localAudioRef.current) {
      localAudioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const setVolumeLevel = useCallback((vol: number) => {
    setVolume(vol);
    if (youtubePlayerRef.current) youtubePlayerRef.current.setVolume(vol);
    if (localAudioRef.current) localAudioRef.current.volume = vol / 100;
  }, []);

  // EQ stubs
  const setBass = (val: number) => setBassState(val);
  const setMid = (val: number) => setMidState(val);
  const setTreble = (val: number) => setTrebleState(val);
  const setPan = (val: number) => setPanState(val);
  const getFrequencyData = () => null;

  // Pitch control
  const setPitch = (val: number) => {
    setPitchState(val);
    if (localAudioRef.current) {
      import('../services/audioEngine').then(eng => eng.setPitch(val, localAudioRef.current!));
    }
  };

  // ReplayGain
  const setReplayGain = (val: boolean) => {
    setReplayGainState(val);
    import('../services/audioEngine').then(eng => eng.setReplayGain(val));
  };

  // Queue controls
  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);
  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);
  const clearQueue = useCallback(() => setQueue([]), []);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const toggleRepeat = useCallback(() => {
    setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none');
  }, []);
  const setCrossfadeDuration = useCallback((sec: number) => setCrossfadeDurationState(sec), []);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowRight': e.preventDefault(); seek(Math.min((youtubePlayerRef.current?.getCurrentTime() || progress) + 10, duration)); break;
        case 'ArrowLeft': e.preventDefault(); seek(Math.max((youtubePlayerRef.current?.getCurrentTime() || progress) - 10, 0)); break;
        case 'KeyM': e.preventDefault();
          if (youtubePlayerRef.current) {
            youtubePlayerRef.current.isMuted() ? youtubePlayerRef.current.unMute() : youtubePlayerRef.current.mute();
          }
          break;
        case 'KeyS': e.preventDefault(); toggleShuffle(); break;
        case 'KeyR': e.preventDefault(); toggleRepeat(); break;
        case 'KeyN': e.preventDefault(); playNext(); break;
        case 'Slash': if (e.shiftKey) { e.preventDefault(); setShowShortcuts(v => !v); } break;
        case 'KeyQ': e.preventDefault(); setShowQueue(v => !v); break;
        case 'KeyF': e.preventDefault(); setShowFullScreen(v => !v); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // MediaSession
    if ('mediaSession' in navigator && currentTrackRef.current) {
      const t = currentTrackRef.current;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title, artist: t.artist,
        artwork: t.coverArt ? [{ src: t.coverArt, sizes: '512x512', type: 'image/jpeg' }] : []
      });
      navigator.mediaSession.setActionHandler('play', togglePlayPause);
      navigator.mediaSession.setActionHandler('pause', togglePlayPause);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
      navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    }

    progressIntervalRef.current = setInterval(() => {
      if (isPlaying && youtubePlayerRef.current) {
        const t = youtubePlayerRef.current.getCurrentTime() || 0;
        const d = youtubePlayerRef.current.getDuration() || 0;
        setProgress(t);
        // Update MediaSession position for lock screen scrubber
        updateMediaSessionPosition(t, d);
        // Crossfade trigger
        if (crossfadeDuration > 0 && d > 0 && d - t <= crossfadeDuration && d - t > crossfadeDuration - 1.1) {
          pickNextTrack().then(next => { if (next) startCrossfade(next); });
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(progressIntervalRef.current);
    };
  }, [currentTrack, isPlaying, togglePlayPause, seek, toggleShuffle, toggleRepeat, playNext, playPrev, crossfadeDuration]);

  const onReady = (event: any) => {
    youtubePlayerRef.current = event.target;
    event.target.setVolume(volume);
  };

  const onStateChange = (event: any) => {
    // 1: playing, 2: paused, 0: ended
    if (event.data === 1) {
      setIsPlaying(true);
      setDuration(event.target.getDuration() || 0);
      setMediaSessionPlayback('playing');
      startBackgroundKeepAlive();
    } else if (event.data === 2) {
      setIsPlaying(false);
      setMediaSessionPlayback('paused');
    } else if (event.data === 0) {
      handleEnded();
    }
  };

  const opts: any = {
    height: '0', width: '0',
    playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1 },
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume,
      bass, mid, treble, pan, pitch, replayGain,
      queue, shuffle, repeat, recentlyPlayed, crossfadeDuration,
      showQueue, showFullScreen, showShortcuts, showLyrics, showMiniPlayer,
      playTrack, togglePlayPause, seek, setVolumeLevel,
      setBass, setMid, setTreble, setPan, setPitch, setReplayGain, getFrequencyData,
      addToQueue, removeFromQueue, clearQueue, playNext, playPrev,
      toggleShuffle, toggleRepeat, setCrossfadeDuration,
      setShowQueue, setShowFullScreen, setShowShortcuts, setShowLyrics, setShowMiniPlayer,
    }}>
      {children}
      {currentTrack && !(currentTrack as any).isLocal && (
        <div style={{ display: 'none' }}>
          <YouTube videoId={currentTrack.id} opts={opts} onReady={onReady} onStateChange={onStateChange} onError={(e) => console.error('YT Error', e)} />
        </div>
      )}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}
