// @ts-nocheck
import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { Track } from '../data/tracks';
// @ts-ignore
import { getColorSync, getPaletteSync } from 'colorthief';
import { API_BASE } from '../api/backend';
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
  enableAudioEngine: boolean;
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
  setEnableAudioEngine: (val: boolean) => void;
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
  const [enableAudioEngine, setEnableAudioEngineState] = useState(() => {
    // Default to false on mobile, true on desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    return !isMobile;
  });

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<any>(null);
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
      fetch(`${API_BASE}/recent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-ID': deviceId },
        body: JSON.stringify({ id: track.id, title: track.title, artist: track.artist, coverArt: track.coverArt, duration: (track as any).duration || '0:00' })
      }).catch(() => {});
      // Last.fm scrobble
      fetch(`${API_BASE}/scrobble`, {
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

  // --- Handle song ended ---
  const handleEnded = useCallback(async () => {
    setIsPlaying(false);
    setProgress(0);
    const next = await pickNextTrack();
    if (next) {
      setCurrentTrack(next); // This will trigger playTrack in useEffect or we can just call playTrack
      playTrack(next); // Call explicitly since we removed crossfade automatic setter for simplicity here
    }
  }, [pickNextTrack]);

  // --- Crossfade logic (Volume fade out) ---
  const startCrossfade = useCallback((nextTrack: Track) => {
    if (!audioRef.current || crossfadeDuration === 0) {
      setCurrentTrack(nextTrack);
      playTrack(nextTrack);
      return;
    }
    const steps = 20;
    const interval = (crossfadeDuration * 1000) / steps;
    let step = 0;
    clearInterval(crossfadeTimerRef.current);
    crossfadeTimerRef.current = setInterval(() => {
      step++;
      const vol = Math.max(0, volume * (1 - step / steps));
      try { if (audioRef.current) audioRef.current.volume = vol / 100; } catch {}
      if (step >= steps) {
        clearInterval(crossfadeTimerRef.current);
        setCurrentTrack(nextTrack);
        playTrack(nextTrack);
      }
    }, interval);
  }, [crossfadeDuration, volume]);

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

    // Update MediaSession early
    updateMediaSession(
      { title: track.title, artist: track.artist, coverArt: track.coverArt },
      {
        play: () => { audioRef.current?.play(); setIsPlaying(true); setMediaSessionPlayback('playing'); startBackgroundKeepAlive(); },
        pause: () => { audioRef.current?.pause(); setIsPlaying(false); setMediaSessionPlayback('paused'); stopBackgroundKeepAlive(); },
        next: playNext,
        prev: playPrev,
        seekTo: (d) => { if (d.seekTime != null) seek(d.seekTime); },
      }
    );

    // Setup HTML5 Audio
    try { audioRef.current?.pause(); } catch {}
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    
    audio.volume = volume / 100;
    audio.preservesPitch = true;
    (audio as any).mozPreservesPitch = true;
    (audio as any).webkitPreservesPitch = true;

    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.ontimeupdate = () => {
      setProgress(audio.currentTime);
      updateMediaSessionPosition(audio.currentTime, audio.duration || 0);
      
      // Crossfade logic
      const d = audio.duration || 0;
      const t = audio.currentTime;
      if (crossfadeDuration > 0 && d > 0 && d - t <= crossfadeDuration && d - t > crossfadeDuration - 0.5) {
        // Prevent multiple triggers
        if (!crossfadeTimerRef.current) {
           pickNextTrack().then(next => { if (next) startCrossfade(next); });
        }
      }
    };
    audio.onended = handleEnded;
    
    // Connect to Audio Engine (Web Audio API) only if enabled
    if (enableAudioEngine) {
      import('../services/audioEngine').then(eng => {
        eng.connectLocalAudio(audio);
        eng.setPitch(pitch, audio);
      });
    }

    // iOS/Mobile audio unlock trick: play a silent base64 audio first
    // This satisfies the "play must be triggered by user gesture synchronously" rule
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !audio.src) {
      audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      audio.play().catch(() => {});
    }

    if ((track as any).isLocal && (track as any).localUrl) {
      audio.src = (track as any).localUrl;
      audio.play().then(() => {
        setIsPlaying(true);
        setMediaSessionPlayback('playing');
        startBackgroundKeepAlive();
      }).catch(console.error);
    } else {
      // Fetch the raw googlevideo.com URL instead of using a 302 redirect endpoint
      // This permanently fixes mobile Safari/Chrome audio loading issues!
      import('../api/backend').then(({ getStreamUrl }) => {
        getStreamUrl(track.id, track.title, track.artist).then(url => {
          if (url) {
            audio.src = url;
            audio.play().then(() => {
              setIsPlaying(true);
              setMediaSessionPlayback('playing');
              startBackgroundKeepAlive();
            }).catch(console.error);
          }
        });
      });
    }

  }, [addToRecent, handleEnded, volume, crossfadeDuration, pitch, enableAudioEngine]);

  // --- Play Next / Prev ---
  const playNext = useCallback(async () => {
    const next = await pickNextTrack();
    if (next) startCrossfade(next);
  }, [pickNextTrack, startCrossfade]);

  const playPrev = useCallback(() => {
    if (progress > 3) {
      seek(0);
      return;
    }
    const h = historyRef.current;
    if (h.length > 0) {
      const prev = h[0];
      setHistory(p => p.slice(1));
      setCurrentTrack(prev);
      playTrack(prev);
    }
  }, [progress, playTrack]);

  // --- togglePlayPause ---
  const togglePlayPause = useCallback(() => {
    if (audioRef.current && currentTrackRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setMediaSessionPlayback('paused');
        stopBackgroundKeepAlive();
      } else {
        audioRef.current.play().then(() => { 
          setIsPlaying(true); 
          setMediaSessionPlayback('playing'); 
          startBackgroundKeepAlive(); 
        }).catch(console.error);
      }
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const setVolumeLevel = useCallback((vol: number) => {
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol / 100;
  }, []);

  // EQ stubs
  const setBass = (val: number) => {
    setBassState(val);
    if (enableAudioEngine) import('../services/audioEngine').then(eng => eng.setBassValue(val));
  };
  const setMid = (val: number) => {
    setMidState(val);
    if (enableAudioEngine) import('../services/audioEngine').then(eng => eng.setMidValue(val));
  };
  const setTreble = (val: number) => {
    setTrebleState(val);
    if (enableAudioEngine) import('../services/audioEngine').then(eng => eng.setTrebleValue(val));
  };
  const setPan = (val: number) => {
    setPanState(val);
    if (enableAudioEngine) import('../services/audioEngine').then(eng => eng.setPanValue(val));
  };
  const getFrequencyData = () => null;

  // Pitch control
  const setPitch = (val: number) => {
    setPitchState(val);
    if (audioRef.current) {
      import('../services/audioEngine').then(eng => eng.setPitch(val, audioRef.current!));
    }
  };

  // ReplayGain
  const setReplayGain = (val: boolean) => {
    setReplayGainState(val);
    if (enableAudioEngine) import('../services/audioEngine').then(eng => eng.setReplayGain(val));
  };

  const setEnableAudioEngine = (val: boolean) => {
    setEnableAudioEngineState(val);
    if (!val && audioRef.current) {
      // Disconnect Web Audio API to allow background play
      import('../services/audioEngine').then(eng => eng.disconnectAudio());
    } else if (val && audioRef.current) {
      // Reconnect
      import('../services/audioEngine').then(eng => {
        eng.connectLocalAudio(audioRef.current!);
        eng.setPitch(pitch, audioRef.current!);
      });
    }
  };

  // Queue controls
  const addToQueue = useCallback((track: Track) => setQueue(prev => [...prev, track]), []);
  const removeFromQueue = useCallback((index: number) => setQueue(prev => prev.filter((_, i) => i !== index)), []);
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
        case 'ArrowRight': e.preventDefault(); seek(Math.min((audioRef.current?.currentTime || progress) + 10, duration)); break;
        case 'ArrowLeft': e.preventDefault(); seek(Math.max((audioRef.current?.currentTime || progress) - 10, 0)); break;
        case 'KeyM': e.preventDefault();
          if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted;
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying, togglePlayPause, seek, toggleShuffle, toggleRepeat, playNext, playPrev, crossfadeDuration, duration, progress]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume,
      bass, mid, treble, pan, pitch, replayGain, enableAudioEngine,
      queue, shuffle, repeat, recentlyPlayed, crossfadeDuration,
      showQueue, showFullScreen, showShortcuts, showLyrics, showMiniPlayer,
      playTrack, togglePlayPause, seek, setVolumeLevel,
      setBass, setMid, setTreble, setPan, setPitch, setReplayGain, setEnableAudioEngine, getFrequencyData,
      addToQueue, removeFromQueue, clearQueue, playNext, playPrev,
      toggleShuffle, toggleRepeat, setCrossfadeDuration,
      setShowQueue, setShowFullScreen, setShowShortcuts, setShowLyrics, setShowMiniPlayer,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}
