// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2, UserMinus, Search, Music2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFollowedArtists, unfollowArtist } from '../api/backend';
import '../components/MainContent.css';
import './Library.css';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => { loadArtists(); }, []);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const data = await getFollowedArtists();
      setArtists(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setArtists([]); }
    finally { setLoading(false); }
  };

  const handleUnfollow = async (e: any, browseId: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Unfollow ${name}?`)) return;
    await unfollowArtist(browseId);
    setArtists(prev => prev.filter(a => a.browseId !== browseId));
    showToast(`Unfollowed ${name}`);
  };

  const filtered = searchQuery
    ? artists.filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : artists;

  return (
    <motion.main className="main-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="top-bar">
        <h2>Followed Artists</h2>
        {artists.length > 0 && (
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              style={{ paddingLeft: 30, background: 'var(--bg-surface)', border: 'var(--glass-border)', borderRadius: 20, padding: '8px 12px 8px 30px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: 180 }}
              placeholder="Search artists..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </header>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 20 }}>
        {artists.length} artists followed
      </p>

      {loading ? (
        <div className="artists-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="skeleton-card" style={{ width: 120, height: 120, borderRadius: '50%' }} />
              <div className="skeleton-card" style={{ width: 80, height: 14, borderRadius: 7 }} />
            </div>
          ))}
        </div>
      ) : artists.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '4rem', marginBottom: 8 }}>🎤</div>
          <h3>Not Following Anyone</h3>
          <p>Follow your favorite artists to see them here and stay updated with their latest releases.</p>
          <button className="primary-btn" style={{ marginTop: 12 }} onClick={() => navigate('/explore')}>
            <Music2 size={16} /> Discover Artists
          </button>
        </div>
      ) : (
        <div className="artists-grid">
          {filtered.map((artist, idx) => (
            <motion.div
              key={artist.browseId}
              className="artist-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ scale: 1.06 }}
              onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 12px', borderRadius: 20, textAlign: 'center', position: 'relative' }}
            >
              <div className="artist-avatar" style={{
                backgroundImage: artist.coverArt ? `url(${artist.coverArt})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                background: !artist.coverArt ? 'var(--accent-gradient)' : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 110, height: 110, borderRadius: '50%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                border: '3px solid var(--border-color)',
              }}>
                {!artist.coverArt && <Mic2 size={36} color="white" />}
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{artist.name}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Artist</p>
              </div>
              <button
                className="unfollow-btn"
                title="Unfollow"
                onClick={(e) => handleUnfollow(e, artist.browseId, artist.name)}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 20, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <UserMinus size={11} /> Unfollow
              </button>
            </motion.div>
          ))}
        </div>
      )}
      {toast && <div className="settings-toast">{toast}</div>}
    </motion.main>
  );
}
