import { usePlayer } from '../context/PlayerContext';
import { useLikedTracks } from '../context/LikedTracksContext';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import '../components/MainContent.css'; // Reuse track-grid styles

export default function LikedSongs() {
  const { likedTracks, toggleLike } = useLikedTracks();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();

  const handleTrackClick = (track: any) => {
    playTrack(track);
    navigate(`/track/${track.id}`, { state: { track } });
  };

  return (
    <motion.main 
      className="main-content"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <header className="top-bar">
        <h2>Liked Songs</h2>
      </header>

      <div className="section-title">
        <h3>Your Collection</h3>
      </div>
      
      {likedTracks.length === 0 ? (
        <p className="no-results">You haven't liked any songs yet. Go discover some!</p>
      ) : (
        <div className="track-grid">
          {likedTracks.map((track) => (
            <div 
              key={track.id} 
              className={`track-card glass-panel ${currentTrack?.id === track.id ? 'active-card' : ''}`}
            >
              <div 
                className="track-img-placeholder" 
                style={{ backgroundImage: `url(${track.coverArt})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}
                onClick={() => handleTrackClick(track)}
              >
                {currentTrack?.id === track.id && (
                  <div className="play-overlay">
                    {isPlaying ? '⏸' : '▶'}
                  </div>
                )}
              </div>
              <h4>{track.title}</h4>
              <p>{track.artist}</p>
              
              <button 
                className="like-btn" 
                onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--accent-primary)', 
                  cursor: 'pointer',
                  position: 'absolute',
                  top: '10px',
                  right: '10px'
                }}
              >
                <Heart fill="var(--accent-primary)" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.main>
  );
}
