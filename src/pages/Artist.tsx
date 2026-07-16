import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useLikedTracks } from '../context/LikedTracksContext';
import { getArtist, API_BASE } from '../api/backend';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Track } from '../data/tracks';
import '../components/MainContent.css';

export default function Artist() {
  const { name } = useParams<{ name: string }>();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { toggleLike, isLiked } = useLikedTracks();
  const [artistData, setArtistData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [similarArtists, setSimilarArtists] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtist = async () => {
      setLoading(true);
      if (name) {
        const data = await getArtist(name);
        setArtistData(data);
        // Fetch similar artists
        try {
          const res = await fetch(`${API_BASE}/artist/similar?artist_name=${encodeURIComponent(name)}`);
          const similar = await res.json();
          setSimilarArtists(Array.isArray(similar) ? similar : []);
        } catch {}
      }
      setLoading(false);
    };
    fetchArtist();
  }, [name]);

  const handleTrackClick = (track: Track) => {
    playTrack(track);
    navigate(`/track/${track.id}`, { state: { track } });
  };

  return (
    <motion.main 
      className="main-content"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      
      {loading ? (
        <div className="loading-spinner">Fetching artist details...</div>
      ) : artistData ? (
        <>
          <div className="track-hero" style={{ marginTop: '1rem', alignItems: 'center' }}>
            <div 
              className="large-album-art glass-panel"
              style={{ 
                backgroundImage: `url(${artistData.thumbnails?.[artistData.thumbnails.length - 1]?.url || artistData.thumbnails?.[0]?.url || ''})`,
                borderRadius: '50%' 
              }}
            >
            </div>
            <div className="track-hero-info">
              <h2 style={{ fontSize: '3rem' }}>{artistData.name}</h2>
              <p>{artistData.subscribers}</p>
              {artistData.description && (
                <p style={{ opacity: 0.8, marginTop: '1rem', maxWidth: '600px' }}>
                  {artistData.description.substring(0, 150)}...
                </p>
              )}
            </div>
          </div>

          <div className="section-title">
            <h3>Top Songs</h3>
          </div>

          <div className="track-grid">
            {artistData.top_songs?.map((track: Track) => (
              <div 
                key={track.id} 
                className={`track-card glass-panel ${currentTrack?.id === track.id ? 'active-card' : ''}`}
                onClick={() => handleTrackClick(track)}
                style={{ position: 'relative' }}
              >
                <div 
                  className="track-img-placeholder" 
                  style={{ backgroundImage: `url(${track.coverArt})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}
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
                  onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 10
                  }}
                >
                  <Heart fill={isLiked(track.id) ? 'var(--accent-primary)' : 'none'} color={isLiked(track.id) ? 'var(--accent-primary)' : 'var(--text-primary)'} />
                </button>
              </div>
            ))}
          </div>

          {/* Similar Artists */}
          {similarArtists.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: '2rem' }}>
                <h3>Similar Artists</h3>
              </div>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                {similarArtists.map((artist: any, i: number) => (
                  <motion.div
                    key={artist.browseId || i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                    style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer', width: 110 }}
                  >
                    {artist.coverArt ? (
                      <img src={artist.coverArt} alt={artist.name}
                        style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '2px solid rgba(255,255,255,0.1)' }} />
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '1.8rem' }}>🎤</div>
                    )}
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {artist.name}
                    </p>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="no-results">Artist not found.</div>
      )}
    </motion.main>
  );
}
