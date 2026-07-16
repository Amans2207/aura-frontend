/**
 * Background Audio Service
 * Keeps audio alive when mobile screen locks or browser is backgrounded.
 * Uses a silent audio loop + MediaSession API.
 */

// Silent 1-second audio buffer (base64 encoded WAV)
const SILENT_AUDIO_SRC = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let silentAudio: HTMLAudioElement | null = null;
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

export function initBackgroundAudio(): HTMLAudioElement {
  if (!silentAudio) {
    silentAudio = new Audio(SILENT_AUDIO_SRC);
    silentAudio.loop = true;
    silentAudio.volume = 0.01; // Nearly silent but not completely to avoid browser killing it
  }
  return silentAudio;
}

/**
 * Call this when music starts playing.
 * Starts the silent audio loop to keep the audio context alive on iOS/Android.
 */
export function startBackgroundKeepAlive() {
  const audio = initBackgroundAudio();
  audio.play().catch(() => {
    // Autoplay blocked - this is fine, will work after user interaction
  });

  // Ping every 25 seconds to prevent browser suspending the context
  if (!keepAliveInterval) {
    keepAliveInterval = setInterval(() => {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    }, 25000);
  }
}

/**
 * Call this when music stops.
 */
export function stopBackgroundKeepAlive() {
  if (silentAudio) {
    silentAudio.pause();
  }
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

/**
 * Sets up MediaSession API for lock screen controls.
 * Must be called whenever the current track changes.
 */
export function updateMediaSession(
  track: { title: string; artist: string; coverArt?: string },
  handlers: {
    play: () => void;
    pause: () => void;
    next: () => void;
    prev: () => void;
    seekTo?: (details: MediaSessionActionDetails) => void;
  }
) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: 'Aura Music',
    artwork: track.coverArt
      ? [
          { src: track.coverArt, sizes: '96x96', type: 'image/jpeg' },
          { src: track.coverArt, sizes: '128x128', type: 'image/jpeg' },
          { src: track.coverArt, sizes: '192x192', type: 'image/jpeg' },
          { src: track.coverArt, sizes: '256x256', type: 'image/jpeg' },
          { src: track.coverArt, sizes: '384x384', type: 'image/jpeg' },
          { src: track.coverArt, sizes: '512x512', type: 'image/jpeg' },
        ]
      : [],
  });

  navigator.mediaSession.setActionHandler('play', handlers.play);
  navigator.mediaSession.setActionHandler('pause', handlers.pause);
  navigator.mediaSession.setActionHandler('nexttrack', handlers.next);
  navigator.mediaSession.setActionHandler('previoustrack', handlers.prev);
  navigator.mediaSession.setActionHandler('seekto', handlers.seekTo || null);
}

export function setMediaSessionPlayback(state: 'playing' | 'paused' | 'none') {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state;
  }
}

export function updateMediaSessionPosition(
  currentTime: number,
  duration: number,
  playbackRate: number = 1
) {
  if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
  if (!duration || isNaN(duration)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, duration),
      playbackRate,
      position: Math.min(Math.max(0, currentTime), duration),
    });
  } catch {}
}

/**
 * Show OS-level notification when track changes
 */
export function showTrackNotification(track: { title: string; artist: string; coverArt?: string }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification('🎵 Now Playing', {
      body: `${track.title} — ${track.artist}`,
      icon: track.coverArt || '/logo.png',
      silent: true,
      tag: 'aura-now-playing',
    });
    setTimeout(() => n.close(), 3000);
  } catch {}
}
