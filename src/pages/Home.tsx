import { useState, useEffect, useRef } from 'react';
import '../components/MainContent.css';
import './Home.css';
import { usePlayer } from '../context/PlayerContext';
import type { Track } from '../data/tracks';
import { searchTracks, getExplore } from '../api/backend';
import { useNavigate } from 'react-router-dom';
import { useLikedTracks } from '../context/LikedTracksContext';
import { Heart, ListPlus, Flame, Sparkles, Search, Video, Music2, Play, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoModal from '../components/VideoModal';

const API_BASE = 'http://localhost:8000';
const getDeviceId = () => {
  let id = localStorage.getItem('aura_device_id');
  if (!id) { id = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('aura_device_id', id); }
  return id;
};

type ViewMode = 'grid' | 'list';

export default function Home() {
  const { playTrack, currentTrack, isPlaying, addToQueue, recentlyPlayed } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [indiaCharts, setIndiaCharts] = useState<Track[]>([]);
  const [discoverWeekly, setDiscoverWeekly] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'trending' | 'india' | 'discover'>('trending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [videoModal, setVideoModal] = useState<Track | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleLike, isLiked } = useLikedTracks();

  const getGreeting = () => {
    const h = new Date().getHours();
    const name = localStorage.getItem('aura_profile_name') || '';
    const nameStr = name && name !== 'Guest User' ? `, ${name}` : '';
    if (h < 5)  return { text: `Night Owl${nameStr} 🦉`, sub: 'Still up? Here\'s some late-night vibes.' };
    if (h < 12) return { text: `Good Morning${nameStr} ☀️`, sub: 'Start your day with some great music!' };
    if (h < 17) return { text: `Good Afternoon${nameStr} 🌤`, sub: 'Keep the energy going with today\'s hits.' };
    if (h < 20) return { text: `Good Evening${nameStr} 🌅`, sub: 'Wind down with your favorite tracks.' };
    return { text: `Good Night${nameStr} 🌙`, sub: 'Perfect time for some chill music.' };
  };

  const greeting = getGreeting();

  useEffect(() => {
    const loadInitialTracks = async () => {
      setLoading(true);
      const newTracks = await getExplore();
      setTracks(newTracks);
      setLoading(false);
    };
    loadInitialTracks();

    fetch(`${API_BASE}/charts/india`)
      .then(r => r.json())
      .then(data => setIndiaCharts(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (recentlyPlayed.length > 0) {
      const deviceId = getDeviceId();
      fetch(`${API_BASE}/discover`, { headers: { 'X-Device-ID': deviceId } })
        .then(r => r.json())
        .then(data => setDiscoverWeekly(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, []);

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      setLoading(true);
      const searchResults = await searchTracks(searchQuery);
      setTracks(searchResults);
      setLoading(false);
      setActiveSection('trending');
    }
  };

  const handleTrackClick = (track: Track) => {
    playTrack(track);
    navigate(`/track/${track.id}`, { state: { track } });
  };

  const displayTracks = activeSection === 'india'
    ? indiaCharts
    : activeSection === 'discover'
    ? discoverWeekly
    : tracks;


  return (
    <motion.main
      className="main-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Video Modal */}
      <AnimatePresence>
        {videoModal && (
          <VideoModal
            videoId={videoModal.id}
            title={videoModal.title}
            artist={videoModal.artist}
            onClose={() => setVideoModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Greeting Banner */}
      <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 18, background: 'var(--bg-elevated)', backdropFilter: 'blur(16px)', border: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{greeting.text}</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>{greeting.sub}</p>
        </div>
        <div style={{ fontSize: '2rem', lineHeight: 1, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}>🎵</div>
      </div>

      {/* Top Search Bar */}
      <header className="top-bar">
        <div className="search-bar search-bar-enhanced">
          <Search size={18} className="search-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search songs, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}>
              ✕
            </button>
          )}
        </div>
        <div className="top-bar-right">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active-view' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >⊞</button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active-view' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >☰</button>
        </div>
      </header>

      {/* Hero Banner — only when not searching */}
      {!searchQuery && (
        <div className="hero-banner">
          <div className="hero-banner-content">
            <motion.div
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              ✨ New Experience
            </motion.div>
            <motion.h1
              className="hero-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Your Music,<br />
              <span className="text-gradient">Everywhere</span>
            </motion.h1>
            <motion.p
              className="hero-sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Stream audio &amp; video • Queue • Shuffle • Crossfade • Background play
            </motion.p>
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                className="hero-play-btn"
                onClick={() => displayTracks.length > 0 && playTrack(displayTracks[0])}
                disabled={displayTracks.length === 0}
              >
                <Play size={18} fill="white" /> Play Now
              </button>
              <button
                className="hero-explore-btn"
                onClick={() => navigate('/explore')}
              >
                <TrendingUp size={18} /> Explore
              </button>
            </motion.div>
          </div>
          <div className="hero-visual">
            {displayTracks.slice(0, 3).map((t, i) => (
              <motion.img
                key={t.id}
                src={t.coverArt}
                alt={t.title}
                className={`hero-art hero-art-${i}`}
                initial={{ opacity: 0, scale: 0.7, rotate: i * 12 - 12 }}
                animate={{ opacity: 1, scale: 1, rotate: i * 8 - 8 }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search result label */}
      {searchQuery && (
        <div className="search-result-label">
          <span>Results for <strong>"{searchQuery}"</strong></span>
          <span className="result-hint">
            <Music2 size={14} /> Audio &nbsp;|&nbsp; <Video size={14} /> Video — available per track
          </span>
        </div>
      )}

      {/* Section Tabs */}
      <div className="section-tabs">
        <button
          className={`section-tab ${activeSection === 'trending' ? 'active-tab' : ''}`}
          onClick={() => setActiveSection('trending')}
        >
          🌍 {searchQuery ? 'Search Results' : 'Trending'}
        </button>
        <button
          className={`section-tab ${activeSection === 'india' ? 'active-tab' : ''}`}
          onClick={() => setActiveSection('india')}
        >
          <Flame size={14} /> 🇮🇳 Top India
        </button>
        {discoverWeekly.length > 0 && (
          <button
            className={`section-tab ${activeSection === 'discover' ? 'active-tab' : ''}`}
            onClick={() => setActiveSection('discover')}
          >
            <Sparkles size={14} /> Discover Weekly
          </button>
        )}
      </div>

      {/* Track Grid / List */}
      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="track-grid">
          <AnimatePresence>
            {displayTracks.map((track, i) => (
              <motion.div
                key={track.id}
                className={`track-card glass-panel ${currentTrack?.id === track.id ? 'active-card' : ''}`}
                style={{ position: 'relative' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}
              >
                <div
                  className="track-img-placeholder"
                  style={{ backgroundImage: `url(${track.coverArt})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}
                  onClick={() => handleTrackClick(track)}
                >
                  <div className="track-img-overlay">
                    <button className="overlay-play-btn" onClick={(e) => { e.stopPropagation(); handleTrackClick(track); }}>
                      {currentTrack?.id === track.id && isPlaying ? '⏸' : <Play size={22} fill="white" />}
                    </button>
                    <button
                      className="overlay-video-btn"
                      title="Watch Video"
                      onClick={(e) => { e.stopPropagation(); setVideoModal(track); }}
                    >
                      <Video size={14} />
                    </button>
                  </div>
                  {currentTrack?.id === track.id && (
                    <div className="now-playing-pulse" />
                  )}
                </div>
                <div className="track-card-body" onClick={() => handleTrackClick(track)}>
                  <h4 className="track-card-title">{track.title}</h4>
                  <p className="track-card-artist">{track.artist}</p>
                </div>
                <div className="track-card-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                    className="card-action-btn"
                    title="Like"
                  >
                    <Heart size={13} fill={isLiked(track.id) ? 'var(--accent-primary)' : 'none'} color={isLiked(track.id) ? 'var(--accent-primary)' : 'currentColor'} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                    className="card-action-btn"
                    title="Add to Queue"
                  >
                    <ListPlus size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {displayTracks.length === 0 && (
            <p className="no-results">
              {activeSection === 'india' ? '⏳ Loading India Charts...' : activeSection === 'discover' ? '🎵 Play more songs to unlock your Discover Weekly!' : 'No tracks found.'}
            </p>
          )}
        </div>
      ) : (
        /* List View */
        <div className="track-list-view">
          {displayTracks.map((track, i) => (
            <motion.div
              key={track.id}
              className={`track-list-row glass-panel ${currentTrack?.id === track.id ? 'active-card' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <span className="tl-num">{i + 1}</span>
              <img
                src={track.coverArt}
                alt={track.title}
                className="tl-art"
                onClick={() => handleTrackClick(track)}
              />
              <div className="tl-info" onClick={() => handleTrackClick(track)}>
                <span className="tl-title">{track.title}</span>
                <span className="tl-artist">{track.artist}</span>
              </div>
              <div className="tl-actions">
                <button className="tl-btn" onClick={() => handleTrackClick(track)} title="Play Audio">
                  <Music2 size={15} /> Audio
                </button>
                <button className="tl-btn tl-video-btn" onClick={() => setVideoModal(track)} title="Watch Video">
                  <Video size={15} /> Video
                </button>
                <button className="card-action-btn" onClick={() => toggleLike(track)}>
                  <Heart size={13} fill={isLiked(track.id) ? 'var(--accent-primary)' : 'none'} color={isLiked(track.id) ? 'var(--accent-primary)' : 'currentColor'} />
                </button>
                <button className="card-action-btn" onClick={() => addToQueue(track)}>
                  <ListPlus size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.main>
  );
}
