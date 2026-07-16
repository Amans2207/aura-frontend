import { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useLikedTracks } from '../context/LikedTracksContext';
import { getExplore } from '../api/backend';
import { useNavigate } from 'react-router-dom';
import { Heart, ListPlus, Video, Play, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Track } from '../data/tracks';
import VideoModal from '../components/VideoModal';
import '../components/MainContent.css';

export default function Explore() {
  const { playTrack, currentTrack, isPlaying, addToQueue } = usePlayer();
  const { toggleLike, isLiked } = useLikedTracks();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoModal, setVideoModal] = useState<Track | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  useEffect(() => {
    const loadCharts = async () => {
      setLoading(true);
      const data = await getExplore();
      setTracks(data);
      setLoading(false);
    };
    loadCharts();
  }, []);

  const handleTrackClick = (track: Track) => {
    playTrack(track);
    navigate(`/track/${track.id}`, { state: { track } });
  };

  return (
    <motion.main 
      className="main-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
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

      <header className="top-bar">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🌍 Explore Global Charts</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className={`view-btn ${viewMode === 'grid' ? 'active-view' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
          <button className={`view-btn ${viewMode === 'list' ? 'active-view' : ''}`} onClick={() => setViewMode('list')}>☰</button>
        </div>
      </header>

      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        Top 50 Global & Trending — Click to <strong>▶ play audio</strong> or watch <strong>🎬 video</strong>
      </div>
      
      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="track-grid">
          <AnimatePresence>
            {tracks.map((track, i) => (
              <motion.div 
                key={track.id} 
                className={`track-card glass-panel ${currentTrack?.id === track.id ? 'active-card' : ''}`}
                style={{ position: 'relative' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                whileHover={{ y: -4 }}
              >
                <div 
                  className="track-img-placeholder" 
                  style={{ backgroundImage: `url(${track.coverArt})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}
                >
                  <div className="track-img-overlay">
                    <button className="overlay-play-btn" onClick={() => handleTrackClick(track)}>
                      {currentTrack?.id === track.id && isPlaying ? '⏸' : <Play size={22} fill="white" />}
                    </button>
                    <button className="overlay-video-btn" onClick={() => setVideoModal(track)}>
                      <Video size={14} /> Video
                    </button>
                  </div>
                  {currentTrack?.id === track.id && <div className="now-playing-pulse" />}
                </div>

                <div className="track-card-body" onClick={() => handleTrackClick(track)}>
                  <h4 className="track-card-title">{track.title}</h4>
                  <p 
                    className="track-card-artist"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/artist/${encodeURIComponent(track.artist)}`); }}
                  >
                    {track.artist}
                  </p>
                </div>

                <div className="track-card-actions">
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(track); }} className="card-action-btn" title="Like">
                    <Heart size={13} fill={isLiked(track.id) ? 'var(--accent-primary)' : 'none'} color={isLiked(track.id) ? 'var(--accent-primary)' : 'currentColor'} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); addToQueue(track); }} className="card-action-btn" title="Add to Queue">
                    <ListPlus size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View with dual Audio/Video buttons */
        <div className="track-list-view">
          {tracks.map((track, i) => (
            <motion.div
              key={track.id}
              className={`track-list-row glass-panel ${currentTrack?.id === track.id ? 'active-card' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.3) }}
            >
              <span className="tl-num">{i + 1}</span>
              <img src={track.coverArt} alt={track.title} className="tl-art" onClick={() => handleTrackClick(track)} />
              <div className="tl-info" onClick={() => handleTrackClick(track)}>
                <span className="tl-title">{track.title}</span>
                <span 
                  className="tl-artist"
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/artist/${encodeURIComponent(track.artist)}`); }}
                >
                  {track.artist}
                </span>
              </div>
              <div className="tl-actions">
                <button className="tl-btn" onClick={() => handleTrackClick(track)} title="Play Audio">
                  <Music2 size={14} /> Audio
                </button>
                <button className="tl-btn tl-video-btn" onClick={() => setVideoModal(track)} title="Watch Video">
                  <Video size={14} /> Video
                </button>
                <button className="card-action-btn" onClick={() => toggleLike(track)} title="Like">
                  <Heart size={13} fill={isLiked(track.id) ? 'var(--accent-primary)' : 'none'} color={isLiked(track.id) ? 'var(--accent-primary)' : 'currentColor'} />
                </button>
                <button className="card-action-btn" onClick={() => addToQueue(track)} title="Queue">
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
