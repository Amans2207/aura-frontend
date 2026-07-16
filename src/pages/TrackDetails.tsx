import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useLikedTracks } from '../context/LikedTracksContext';
import { searchTracks, getBackendLyrics } from '../api/backend';
import type { Track } from '../data/tracks';
import Visualizer from '../components/Visualizer';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, ListPlus } from 'lucide-react';
import VideoModal from '../components/VideoModal';
import './TrackDetails.css';

export default function TrackDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, addToQueue } = usePlayer();
  const { likedTracks, toggleLike } = useLikedTracks();
  const isLiked = likedTracks.some(t => t.id === id);
  
  // We can get the initial track data from router state if we came from Home
  const initialTrack = location.state?.track as Track | undefined;
  
  const [track, setTrack] = useState<Track | null>(initialTrack || null);
  const [lyrics, setLyrics] = useState<string>('Loading lyrics...');
  const [similarTracks, setSimilarTracks] = useState<Track[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [videoTrack, setVideoTrack] = useState<Track | null>(null);

  useEffect(() => {
    // If we don't have the track object (e.g. direct URL visit), we would theoretically fetch it by ID.
    // Since iTunes API doesn't have a reliable lookup by ID that returns the same format easily without a country code,
    // we rely on the state passed during navigation for now, or use the currently playing track.
    if (!track && currentTrack?.id === id) {
      setTrack(currentTrack);
    }
  }, [id, currentTrack, track]);

  useEffect(() => {
    if (track) {
      // Fetch Lyrics
      setLyrics('Loading lyrics...');
      getBackendLyrics(track.id).then(setLyrics);

      // Fetch Similar Tracks (just searching the same artist)
      setLoadingSimilar(true);
      searchTracks(track.artist).then(res => {
        // Filter out the current track
        setSimilarTracks(res.filter(t => t.id !== track.id).slice(0, 10));
        setLoadingSimilar(false);
      });
    }
  }, [track]);

  if (!track) {
    return (
      <div className="track-details-page main-content">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <p>Track not found. Try searching for it.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="track-details-page main-content"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      
      <div className="track-hero">
        <div 
          className="large-album-art glass-panel"
          style={{ backgroundImage: `url(${track.coverArt})` }}
        >
          <div className="play-overlay" onClick={() => playTrack(track)}>
            {currentTrack?.id === track.id && isPlaying ? '⏸' : '▶'}
          </div>
        </div>
        <div className="track-hero-info">
          <h2>{track.title}</h2>
          <h3>{track.artist}</h3>
          <button className="play-large-btn text-gradient" onClick={() => playTrack(track)}>
            {currentTrack?.id === track.id && isPlaying ? 'Pause' : 'Play Track'}
          </button>

          <div className="track-action-bar">
            <button 
              className={`track-action-btn ${isLiked ? 'liked' : ''}`}
              onClick={() => toggleLike(track)}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              {isLiked ? 'Liked' : 'Like'}
            </button>
            <button 
              className="track-action-btn"
              onClick={() => { addToQueue(track); alert('Added to queue!'); }}
              title="Add to Queue"
            >
              <ListPlus size={18} /> Add to Queue
            </button>
            <button 
              className="track-action-btn"
              title="Share"
              onClick={async () => {
                const url = window.location.href;
                if (navigator.share) {
                  await navigator.share({ title: track.title, text: `Listen to ${track.title} by ${track.artist}`, url });
                } else {
                  await navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }
              }}
            >
              <Share2 size={18} /> Share
            </button>
          </div>
          
          <div className="visualizer-container" style={{ marginTop: '2rem' }}>
            <Visualizer />
          </div>
        </div>
      </div>

      <div className="details-grid">
        <div className="lyrics-section glass-panel">
          <h4>Lyrics</h4>
          <pre className="lyrics-text">{lyrics}</pre>
        </div>

        <div className="similar-tracks-section">
          <h4>More by {track.artist}</h4>
          {loadingSimilar ? (
            <p>Loading...</p>
          ) : (
            <div className="similar-track-list">
              {similarTracks.map(simTrack => (
                <div 
                  key={simTrack.id} 
                  className={`sim-track-card glass-panel ${currentTrack?.id === simTrack.id ? 'active-card' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <img src={simTrack.coverArt} alt={simTrack.title} onClick={() => playTrack(simTrack)} style={{ cursor: 'pointer' }} />
                  <div className="sim-track-info" onClick={() => playTrack(simTrack)} style={{ cursor: 'pointer' }}>
                    <h5>{simTrack.title}</h5>
                    <p>{simTrack.artist}</p>
                  </div>
                  <div className="sim-track-btns">
                    <button className="tl-btn" onClick={() => playTrack(simTrack)} title="Play Audio">▶ Audio</button>
                    <button className="tl-btn tl-video-btn" onClick={() => setVideoTrack(simTrack)} title="Watch Video">🎬 Video</button>
                    <button className="card-action-btn" onClick={() => addToQueue(simTrack)} title="Add to Queue"><ListPlus size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {videoTrack && (
          <VideoModal 
            videoId={videoTrack.id} 
            title={videoTrack.title} 
            artist={videoTrack.artist} 
            onClose={() => setVideoTrack(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
