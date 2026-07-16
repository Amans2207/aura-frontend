// @ts-nocheck
import { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { Clock, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import '../components/MainContent.css';
import './Library.css';

export default function RecentlyPlayed() {
  const { recentlyPlayed, playTrack, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();

  const handleTrack = (track: any) => {
    playTrack(track);
    navigate(`/track/${track.id}`, { state: { track } });
  };

  return (
    <motion.main className="main-content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
      <header className="top-bar">
        <h2>Recently Played</h2>
      </header>

      {recentlyPlayed.length === 0 ? (
        <div className="empty-state">
          <Clock size={80} className="empty-icon" />
          <h3>No History Yet</h3>
          <p>Songs you play will appear here. Start listening!</p>
        </div>
      ) : (
        <div className="track-list">
          {recentlyPlayed.map((track, i) => (
            <motion.div
              key={`${track.id}-${i}`}
              className={`track-list-item glass-panel ${currentTrack?.id === track.id ? 'active-card' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleTrack(track)}
            >
              <span className="track-num">{i + 1}</span>
              <img src={track.coverArt} alt={track.title} className="track-list-art" />
              <div className="track-list-info">
                <span className="track-list-title">{track.title}</span>
                <span className="track-list-artist">{track.artist}</span>
              </div>
              <span className="track-list-duration">{(track as any).duration || ''}</span>
              <button className="icon-btn track-play-btn">
                {currentTrack?.id === track.id && isPlaying ? '⏸' : <Play size={16} />}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.main>
  );
}
