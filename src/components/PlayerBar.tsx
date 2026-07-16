import { useState, useEffect } from 'react';
import './PlayerBar.css';
import { usePlayer } from '../context/PlayerContext';
import EQPanel from './EQPanel';
import QueuePanel from './QueuePanel';
import FullScreenPlayer from './FullScreenPlayer';
import KeyboardShortcuts from './KeyboardShortcuts';
import LyricsPanel from './LyricsPanel';
import MiniPlayer from './MiniPlayer';
import { 
  Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1,
  ListMusic, Maximize2, Volume2, VolumeX, Keyboard, Download,
  Mic2, PictureInPicture2, Timer, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds: number) {
  if (isNaN(seconds) || !seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Mini waveform bars — animated when playing
function WaveformBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="waveform-bars">
      {[1,2,3,4].map(i => (
        <div 
          key={i} 
          className={`waveform-bar ${isPlaying ? 'waveform-animate' : ''}`}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

// PWA install prompt hook
function usePWAInstall() {
  const [prompt, setPrompt] = useState<any>(null);
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
  };
  return { canInstall: !!prompt, install };
}

export default function PlayerBar() {
  const { 
    currentTrack, isPlaying, togglePlayPause, progress, duration, seek,
    volume, setVolumeLevel,
    shuffle, repeat, toggleShuffle, toggleRepeat,
    playNext, playPrev, queue,
    showQueue, setShowQueue,
    showFullScreen, setShowFullScreen,
    showShortcuts, setShowShortcuts,
    showLyrics, setShowLyrics,
    showMiniPlayer, setShowMiniPlayer,
  } = usePlayer();

  const [showEQ, setShowEQ] = useState(false);
  const [muted, setMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepCountdown, setSleepCountdown] = useState<number>(0);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { canInstall, install } = usePWAInstall();

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimer === null) return;
    const interval = setInterval(() => {
      setSleepCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSleepTimer(null);
          if (isPlaying) togglePlayPause();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer]);

  const startSleepTimer = (minutes: number) => {
    setSleepTimer(minutes);
    setSleepCountdown(minutes * 60);
    setShowSleepMenu(false);
  };

  const cancelSleepTimer = () => {
    setSleepTimer(null);
    setSleepCountdown(0);
    setShowSleepMenu(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => seek(Number(e.target.value));
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => setVolumeLevel(Number(e.target.value));
  
  const toggleMute = () => {
    if (muted) {
      setVolumeLevel(prevVolume);
      setMuted(false);
    } else {
      setPrevVolume(volume);
      setVolumeLevel(0);
      setMuted(true);
    }
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      <AnimatePresence>
        {showEQ && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <EQPanel onClose={() => setShowEQ(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      {showQueue && <QueuePanel onClose={() => setShowQueue(false)} />}
      {showFullScreen && <FullScreenPlayer onClose={() => setShowFullScreen(false)} />}
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
      {showLyrics && <LyricsPanel onClose={() => setShowLyrics(false)} />}
      {showMiniPlayer && <MiniPlayer onClose={() => setShowMiniPlayer(false)} />}

      {/* PWA Install Banner */}
      <AnimatePresence>
        {canInstall && (
          <motion.div
            className="pwa-banner"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <span>📱 Install Aura Music as an app!</span>
            <button className="pwa-install-btn" onClick={install}>
              <Download size={14} /> Install
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="player-bar glass-panel">
        {/* Now Playing */}
        <div className="now-playing" onClick={() => currentTrack && setShowFullScreen(true)} style={{ cursor: currentTrack ? 'pointer' : 'default' }}>
          <div className="album-art" style={{ backgroundImage: currentTrack ? `url(${currentTrack.coverArt})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {currentTrack && <div className="album-art-hover"><Maximize2 size={16} /></div>}
            {currentTrack && isPlaying && <WaveformBars isPlaying={isPlaying} />}
          </div>
          <div className="track-info">
            <h4>{currentTrack ? currentTrack.title : 'No Track Selected'}</h4>
            <p>{currentTrack ? currentTrack.artist : 'Open Aura Music'}</p>
          </div>
        </div>
        
        {/* Player Controls */}
        <div className="player-controls">
          <div className="control-buttons">
            <button 
              className={`control-btn ${shuffle ? 'active-control' : ''}`} 
              onClick={toggleShuffle} 
              title="Shuffle (S)"
            >
              <Shuffle size={16} />
            </button>
            <button className="control-btn" onClick={playPrev} disabled={!currentTrack} title="Previous">
              <SkipBack size={20} />
            </button>
            <button className="control-btn play-btn" onClick={togglePlayPause} disabled={!currentTrack} title="Play/Pause (Space)">
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>
            <button className="control-btn" onClick={playNext} disabled={!currentTrack} title="Next (N)">
              <SkipForward size={20} />
            </button>
            <button 
              className={`control-btn ${repeat !== 'none' ? 'active-control' : ''}`} 
              onClick={toggleRepeat} 
              title="Repeat (R)"
            >
              {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>
          <div className="progress-bar-container">
            <span>{formatTime(progress)}</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              <input 
                type="range" className="progress-bar"
                min="0" max={duration || 100} value={progress}
                onChange={handleSeek} disabled={!currentTrack}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Extra Controls */}
        <div className="extra-controls">
          <button 
            className={`control-btn icon-btn-sm ${showQueue ? 'active-control' : ''}`} 
            onClick={() => setShowQueue(!showQueue)} 
            title="Queue (Q)"
          >
            <ListMusic size={18} />
            {queue.length > 0 && <span className="queue-badge">{queue.length}</span>}
          </button>
          <button 
            className={`control-btn icon-btn-sm ${showLyrics ? 'active-control' : ''}`} 
            onClick={() => setShowLyrics(!showLyrics)}
            title="Lyrics (L)"
          >
            <Mic2 size={18} />
          </button>
          <button 
            className={`control-btn icon-btn-sm ${showMiniPlayer ? 'active-control' : ''}`} 
            onClick={() => setShowMiniPlayer(!showMiniPlayer)}
            title="Mini Player"
          >
            <PictureInPicture2 size={18} />
          </button>
          <button 
            className={`control-btn eq-btn ${showEQ ? 'active-control' : ''}`} 
            onClick={() => setShowEQ(!showEQ)}
          >EQ</button>
          <button 
            className="control-btn icon-btn-sm" 
            onClick={() => setShowShortcuts(!showShortcuts)} 
            title="Shortcuts (?)"
          >
            <Keyboard size={18} />
          </button>
          <button className="control-btn icon-btn-sm" onClick={toggleMute} title="Mute (M)">
            {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className={`control-btn icon-btn-sm ${sleepTimer !== null ? 'active-control' : ''}`}
              onClick={() => setShowSleepMenu(!showSleepMenu)}
              title="Sleep Timer"
              style={{ fontSize: sleepTimer !== null ? '0.65rem' : undefined, minWidth: sleepTimer !== null ? 36 : undefined, fontWeight: sleepTimer !== null ? 700 : undefined }}
            >
              {sleepTimer !== null ? `${Math.floor(sleepCountdown/60)}:${String(sleepCountdown%60).padStart(2,'0')}` : <Timer size={16} />}
            </button>
            {showSleepMenu && (
              <div style={{ position: 'absolute', bottom: '140%', right: 0, background: 'var(--bg-elevated)', backdropFilter: 'blur(20px)', border: 'var(--glass-border)', borderRadius: 14, padding: '8px', minWidth: 130, boxShadow: 'var(--glass-shadow)', zIndex: 1000 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sleep Timer</div>
                {sleepTimer !== null && (
                  <button onClick={cancelSleepTimer} style={{ width: '100%', padding: '7px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4, textAlign: 'left' }}>
                    Cancel Timer
                  </button>
                )}
                {[15, 30, 45, 60].map(m => (
                  <button key={m} onClick={() => startSleepTimer(m)} style={{ width: '100%', padding: '7px 10px', background: sleepTimer === m ? 'var(--accent-primary)' : 'transparent', color: sleepTimer === m ? 'white' : 'var(--text-primary)', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, textAlign: 'left', transition: 'background 0.15s' }}>
                    {m} minutes
                  </button>
                ))}
              </div>
            )}
          </div>
          <input 
            type="range" className="volume-bar"
            min="0" max="100" value={volume}
            onChange={handleVolumeChange}
          />
          <button 
            className="control-btn mobile-more-btn" 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <MoreHorizontal size={20} />
          </button>

          <AnimatePresence>
            {showMobileMenu && (
              <motion.div 
                className="mobile-overflow-menu"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                <button className="mobile-menu-item" onClick={() => { setShowEQ(true); setShowMobileMenu(false); }}>
                  Equalizer (EQ)
                </button>
                <button className="mobile-menu-item" onClick={() => { setShowLyrics(!showLyrics); setShowMobileMenu(false); }}>
                  <Mic2 size={16} /> Lyrics
                </button>
                <button className="mobile-menu-item" onClick={() => { setShowQueue(!showQueue); setShowMobileMenu(false); }}>
                  <ListMusic size={16} /> Queue
                </button>
                <button className="mobile-menu-item" onClick={() => { setShowSleepMenu(!showSleepMenu); setShowMobileMenu(false); }}>
                  <Timer size={16} /> Sleep Timer
                </button>
                <button className="mobile-menu-item" onClick={() => { setShowShortcuts(true); setShowMobileMenu(false); }}>
                  <Keyboard size={16} /> Shortcuts
                </button>
                <button className="mobile-menu-item" onClick={toggleMute}>
                  {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />} Mute
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
