// @ts-nocheck
import { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Clock, Music, Flame, Trophy, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import '../components/MainContent.css';
import './Stats.css';

export default function StatsPage() {
  const { recentlyPlayed, playTrack } = usePlayer();
  const navigate = useNavigate();

  // Compute stats from local recently played
  const totalTracks = recentlyPlayed.length;

  const parseDuration = (d: string) => {
    try {
      const parts = String(d).split(':');
      if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } catch {}
    return 210; // default 3.5 mins
  };

  const totalMinutes = Math.round(
    recentlyPlayed.reduce((acc, t) => acc + parseDuration((t as any).duration || '3:30'), 0) / 60
  );

  // Top artists
  const artistCounts: Record<string, number> = {};
  for (const t of recentlyPlayed) {
    artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
  }
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, plays]) => ({ name, plays }));

  // Top songs
  const songCounts: Record<string, any> = {};
  for (const t of recentlyPlayed) {
    if (!songCounts[t.id]) songCounts[t.id] = { ...t, plays: 0 };
    songCounts[t.id].plays++;
  }
  const topSongs = Object.values(songCounts)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 5);

  const handleTrack = (track: any) => {
    playTrack(track);
    navigate(`/track/${track.id}`, { state: { track } });
  };

  return (
    <motion.main className="main-content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
      <header className="top-bar">
        <h2>Your Stats</h2>
      </header>

      {/* Overview Cards */}
      <div className="stats-grid">
        <motion.div className="stat-card glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Music size={28} className="stat-icon" />
          <div className="stat-value">{totalTracks}</div>
          <div className="stat-label">Songs Played</div>
        </motion.div>
        <motion.div className="stat-card glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Clock size={28} className="stat-icon" />
          <div className="stat-value">{totalMinutes}</div>
          <div className="stat-label">Minutes Listened</div>
        </motion.div>
        <motion.div className="stat-card glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Flame size={28} className="stat-icon" />
          <div className="stat-value">{topArtists.length}</div>
          <div className="stat-label">Artists Explored</div>
        </motion.div>
      </div>

      <div className="stats-columns">
        {/* Top Artists */}
        <div className="stats-section glass-panel">
          <div className="stats-section-header">
            <Trophy size={20} />
            <h3>Top Artists</h3>
          </div>
          {topArtists.length === 0 ? (
            <p className="stats-empty">Play some songs to see your top artists!</p>
          ) : (
            <div className="top-list">
              {topArtists.map((a, i) => (
                <motion.div 
                  key={a.name} 
                  className="top-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  onClick={() => navigate(`/artist/${encodeURIComponent(a.name)}`)}
                >
                  <span className="top-rank">#{i + 1}</span>
                  <div className="top-info">
                    <span className="top-name">{a.name}</span>
                    <div className="top-bar-track">
                      <div className="top-bar-fill" style={{ width: `${(a.plays / (topArtists[0]?.plays || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="top-plays">{a.plays}×</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Top Songs */}
        <div className="stats-section glass-panel">
          <div className="stats-section-header">
            <BarChart3 size={20} />
            <h3>Top Songs</h3>
          </div>
          {topSongs.length === 0 ? (
            <p className="stats-empty">Your most played songs will appear here!</p>
          ) : (
            <div className="top-list">
              {topSongs.map((song, i) => (
                <motion.div 
                  key={song.id} 
                  className="top-item top-song-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  onClick={() => handleTrack(song)}
                >
                  <span className="top-rank">#{i + 1}</span>
                  <img src={song.coverArt} alt={song.title} className="top-song-art" />
                  <div className="top-info">
                    <span className="top-name">{song.title}</span>
                    <span className="top-sub">{song.artist}</span>
                  </div>
                  <span className="top-plays">{song.plays}×</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}
