// @ts-nocheck
import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { X, SkipBack, Play, Pause, SkipForward, Shuffle, Repeat, Repeat1, Heart, ListMusic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLikedTracks } from '../context/LikedTracksContext';
import './FullScreenPlayer.css';

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export default function FullScreenPlayer({ onClose }: { onClose: () => void }) {
  const { currentTrack, isPlaying, progress, duration, seek, togglePlayPause, playNext, playPrev, shuffle, repeat, toggleShuffle, toggleRepeat, addToQueue, queue } = usePlayer();
  const { likedTracks, toggleLike } = useLikedTracks();
  const isLiked = likedTracks.some(t => t.id === currentTrack?.id);
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!currentTrack) { onClose(); return null; }

  return (
    <motion.div
      className="fullscreen-player"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background blur art */}
      <div className="fs-bg" style={{ backgroundImage: `url(${currentTrack.coverArt})` }} />
      <div className="fs-overlay" />

      <button className="fs-close icon-btn" onClick={onClose}><X size={24} /></button>

      <div className="fs-content">
        {/* Album Art */}
        <motion.div
          className="fs-art"
          animate={{ scale: isPlaying ? 1 : 0.92 }}
          transition={{ duration: 0.4, type: 'spring' }}
        >
          <img src={currentTrack.coverArt} alt={currentTrack.title} />
        </motion.div>

        {/* Track Info */}
        <div className="fs-info">
          <div className="fs-title-row">
            <div>
              <h1 className="fs-title">{currentTrack.title}</h1>
              <p className="fs-artist">{currentTrack.artist}</p>
            </div>
            <button className={`icon-btn fs-like-btn ${isLiked ? 'liked' : ''}`} onClick={() => toggleLike(currentTrack)}>
              <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Progress */}
          <div className="fs-progress-container">
            <div className="fs-progress-track">
              <div className="fs-progress-fill" style={{ width: `${progressPct}%` }} />
              <input
                type="range" className="fs-progress-input"
                min="0" max={duration || 100} value={progress}
                onChange={(e) => seek(Number(e.target.value))}
              />
            </div>
            <div className="fs-times">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="fs-controls">
            <button className={`icon-btn fs-ctrl ${shuffle ? 'active-ctrl' : ''}`} onClick={toggleShuffle}><Shuffle size={22} /></button>
            <button className="icon-btn fs-ctrl" onClick={playPrev}><SkipBack size={28} /></button>
            <button className="icon-btn fs-play-btn" onClick={togglePlayPause}>
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button className="icon-btn fs-ctrl" onClick={playNext}><SkipForward size={28} /></button>
            <button className={`icon-btn fs-ctrl ${repeat !== 'none' ? 'active-ctrl' : ''}`} onClick={toggleRepeat}>
              {repeat === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
