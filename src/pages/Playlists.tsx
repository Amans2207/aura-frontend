// @ts-nocheck
import { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { Plus, ListMusic, Play, Pause, X, Trash2, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlaylists, createPlaylist, getPlaylistTracks, API_BASE, getDeviceId } from '../api/backend';
import '../components/MainContent.css';
import './Library.css';

export default function Playlists() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [toast, setToast] = useState('');
  const { playTrack, currentTrack, isPlaying, setQueue } = usePlayer();
  const navigate = useNavigate();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => { loadPlaylists(); }, []);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setPlaylists([]); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist(newName.trim());
    setNewName('');
    setShowModal(false);
    loadPlaylists();
    showToast('✅ Playlist created!');
  };

  const openPlaylist = async (playlist: any) => {
    setSelectedPlaylist(playlist);
    setTracksLoading(true);
    try {
      const data = await getPlaylistTracks(playlist.id);
      setPlaylistTracks(data.tracks || []);
    } catch { setPlaylistTracks([]); }
    finally { setTracksLoading(false); }
  };

  const handlePlayAll = () => {
    if (!playlistTracks.length) return;
    if (setQueue) setQueue(playlistTracks);
    playTrack(playlistTracks[0]);
    navigate(`/track/${playlistTracks[0].id}`, { state: { track: playlistTracks[0] } });
  };

  const handleDeletePlaylist = async (e: any, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete this playlist?')) return;
    try {
      await fetch(`${API_BASE}/playlists/${id}`, {
        method: 'DELETE',
        headers: { 'X-Device-ID': getDeviceId() }
      });
      setPlaylists(prev => prev.filter(p => p.id !== id));
      showToast('🗑️ Playlist deleted');
    } catch { showToast('❌ Failed to delete'); }
  };

  const handleRemoveTrack = async (e: any, trackId: number) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/playlists/${selectedPlaylist.id}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: { 'X-Device-ID': getDeviceId() }
      });
      setPlaylistTracks(prev => prev.filter(t => t.id !== trackId));
      showToast('Removed from playlist');
    } catch { showToast('❌ Failed to remove'); }
  };

  // Playlist detail view
  if (selectedPlaylist) {
    return (
      <motion.main className="main-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="top-bar">
          <button className="icon-btn" onClick={() => setSelectedPlaylist(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 20, border: 'var(--glass-border)', background: 'var(--bg-surface)' }}>
            ← Back
          </button>
          <h2>{selectedPlaylist.name}</h2>
        </header>

        <div className="playlist-hero glass-panel" style={{
          background: selectedPlaylist.cover_art ? `url(${selectedPlaylist.cover_art}) center/cover` : 'var(--accent-gradient)',
          borderRadius: 20, padding: '32px 28px', marginBottom: 24, display: 'flex', alignItems: 'flex-end',
          minHeight: 180, position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>{selectedPlaylist.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{playlistTracks.length} songs</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={handlePlayAll} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: '#000', border: 'none', borderRadius: 24, padding: '10px 22px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                <Play size={16} fill="currentColor" /> Play All
              </button>
              <button onClick={() => { if (setQueue && playlistTracks.length) { const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5); setQueue(shuffled); playTrack(shuffled[0]); } }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 24, padding: '10px 22px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', backdropFilter: 'blur(8px)' }}>
                <Shuffle size={16} /> Shuffle
              </button>
            </div>
          </div>
        </div>

        {tracksLoading ? (
          <div className="loading-grid">{[1,2,3].map(i => <div key={i} className="skeleton-card" style={{ height: 70, borderRadius: 12 }} />)}</div>
        ) : playlistTracks.length === 0 ? (
          <div className="empty-state">
            <ListMusic size={60} className="empty-icon" />
            <h3>Empty Playlist</h3>
            <p>Search for songs and add them to this playlist.</p>
            <button className="primary-btn" onClick={() => navigate('/')}>Discover Music</button>
          </div>
        ) : (
          <div className="track-list">
            {playlistTracks.map((track, i) => (
              <motion.div
                key={track.id}
                className={`track-list-item glass-panel ${currentTrack?.id === track.id ? 'active-card' : ''}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { playTrack(track); navigate(`/track/${track.id}`, { state: { track } }); }}
              >
                <span className="track-num">{i + 1}</span>
                <img src={track.coverArt} alt={track.title} className="track-list-art" />
                <div className="track-list-info">
                  <span className="track-list-title">{track.title}</span>
                  <span className="track-list-artist">{track.artist}</span>
                </div>
                <span className="track-list-duration">{track.duration}</span>
                {currentTrack?.id === track.id && isPlaying ? <Pause size={16} color="var(--accent-primary)" /> : <Play size={16} className="track-play-btn" />}
                <button className="icon-btn" style={{ color: '#ef4444', opacity: 0.6 }}
                  onClick={(e) => handleRemoveTrack(e, track.id)} title="Remove"><X size={14} /></button>
              </motion.div>
            ))}
          </div>
        )}
        {toast && <div className="settings-toast">{toast}</div>}
      </motion.main>
    );
  }

  return (
    <motion.main className="main-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="top-bar">
        <h2>Your Playlists</h2>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          <Plus size={17} /> New Playlist
        </button>
      </header>

      {loading ? (
        <div className="loading-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card" />)}</div>
      ) : playlists.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '4rem' }}>🎵</div>
          <h3>No Playlists Yet</h3>
          <p>Create your first playlist and start curating your perfect music collection!</p>
          <button className="primary-btn" onClick={() => setShowModal(true)}><Plus size={17} /> Create Playlist</button>
        </div>
      ) : (
        <div className="track-grid">
          {playlists.map((p) => (
            <motion.div
              key={p.id}
              className="track-card glass-panel"
              whileHover={{ scale: 1.03, y: -4 }}
              onClick={() => openPlaylist(p)}
              style={{ position: 'relative' }}
            >
              <div className="track-img-placeholder playlist-cover" style={{
                backgroundImage: p.cover_art ? `url(${p.cover_art})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
                background: p.cover_art ? undefined : 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {!p.cover_art && <ListMusic size={36} color="white" />}
                <div className="play-overlay"><Play size={22} fill="white" color="white" /></div>
              </div>
              <h4>{p.name}</h4>
              <p>{p.track_count || 0} songs</p>
              <button
                className="icon-btn"
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.85)', color: 'white', borderRadius: '50%', width: 26, height: 26, padding: 0, opacity: 0 }}
                onClick={(e) => handleDeletePlaylist(e, p.id)}
                title="Delete Playlist"
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
          {/* Add New Card */}
          <motion.div
            className="track-card glass-panel"
            whileHover={{ scale: 1.03 }}
            onClick={() => setShowModal(true)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, border: '2px dashed var(--border-color)' }}
          >
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Plus size={32} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: '0.85rem' }}>New Playlist</p>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal glass-panel" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create New Playlist</h3>
                <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <input
                className="modal-input"
                type="text"
                placeholder="My Awesome Playlist 🎵"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <div className="modal-actions">
                <button className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="primary-btn" onClick={handleCreate}>Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {toast && <div className="settings-toast">{toast}</div>}
    </motion.main>
  );
}
