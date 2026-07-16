// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc3, Play, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSavedAlbums, removeSavedAlbum, searchTracks } from '../api/backend';
import '../components/MainContent.css';
import './Library.css';

export default function Albums() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => { loadAlbums(); }, []);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const data = await getSavedAlbums();
      setAlbums(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setAlbums([]); }
    finally { setLoading(false); }
  };

  const handleRemove = async (e: any, browseId: string) => {
    e.stopPropagation();
    if (!confirm('Remove this album?')) return;
    await removeSavedAlbum(browseId);
    setAlbums(prev => prev.filter(a => a.browseId !== browseId));
    showToast('Album removed');
  };

  const filtered = searchQuery
    ? albums.filter(a => a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || a.artist?.toLowerCase().includes(searchQuery.toLowerCase()))
    : albums;

  return (
    <motion.main className="main-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="top-bar">
        <h2>Saved Albums</h2>
        {albums.length > 0 && (
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              style={{ paddingLeft: 34, background: 'var(--bg-surface)', border: 'var(--glass-border)', borderRadius: 20, padding: '8px 12px 8px 34px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: 200 }}
              placeholder="Search albums..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </header>

      {loading ? (
        <div className="loading-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card" />)}</div>
      ) : albums.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '4rem', marginBottom: 8 }}>💿</div>
          <h3>No Saved Albums</h3>
          <p>Explore artists and save albums you love for quick access!</p>
          <div style={{ marginTop: 12, padding: '12px 18px', borderRadius: 14, background: 'var(--bg-surface)', border: 'var(--glass-border)', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 300, textAlign: 'left' }}>
            💡 <strong>Tip:</strong> Open any artist page → tap the album art → save it here.
          </div>
          <button className="primary-btn" style={{ marginTop: 16 }} onClick={() => navigate('/explore')}>
            Explore Artists
          </button>
        </div>
      ) : (
        <>
          {filtered.length === 0 && searchQuery ? (
            <p className="no-results">No albums match "{searchQuery}"</p>
          ) : (
            <div className="track-grid">
              {filtered.map((album) => (
                <motion.div
                  key={album.browseId}
                  className="track-card glass-panel"
                  whileHover={{ scale: 1.03, y: -4 }}
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => navigate(`/artist/${encodeURIComponent(album.artist)}`)}
                >
                  <div className="track-img-placeholder" style={{
                    backgroundImage: `url(${album.coverArt})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    <div className="play-overlay"><Play size={24} fill="white" color="white" /></div>
                  </div>
                  <h4>{album.title}</h4>
                  <p>{album.artist}</p>
                  <button
                    className="icon-btn"
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#ef4444', borderRadius: '50%', width: 28, height: 28, padding: 0, opacity: 0, transition: 'opacity 0.2s' }}
                    onClick={(e) => handleRemove(e, album.browseId)}
                    title="Remove Album"
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
      {toast && <div className="settings-toast">{toast}</div>}
    </motion.main>
  );
}
