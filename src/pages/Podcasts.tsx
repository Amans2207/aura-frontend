// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Plus, RefreshCw, Trash2, Play, ChevronRight, Rss, Clock } from 'lucide-react';
import { API_BASE, getDeviceId } from '../api/backend';
import { usePlayer } from '../context/PlayerContext';

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [rssInput, setRssInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [toast, setToast] = useState('');
  const { playTrack } = usePlayer();

  const deviceId = getDeviceId();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchPodcasts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/podcasts`, { headers: { 'X-Device-ID': deviceId } });
      const data = await res.json();
      setPodcasts(Array.isArray(data) ? data : []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async (podcastId: number) => {
    try {
      const res = await fetch(`${API_BASE}/podcasts/${podcastId}`, { headers: { 'X-Device-ID': deviceId } });
      const data = await res.json();
      setSelectedPodcast(data);
      setEpisodes(data.episodes || []);
    } catch {}
  };

  useEffect(() => { fetchPodcasts(); }, []);

  const handleAddPodcast = async () => {
    if (!rssInput.trim()) return;
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/podcasts`, {
        method: 'POST',
        headers: { 'X-Device-ID': deviceId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rss_url: rssInput.trim() })
      });
      const data = await res.json();
      if (data.status === 'success' || data.status === 'already_added') {
        showToast(`✅ ${data.title || 'Podcast'} added!`);
        setRssInput('');
        fetchPodcasts();
      } else {
        showToast('❌ Failed to add podcast');
      }
    } catch { showToast('❌ Invalid RSS feed'); } finally { setAddLoading(false); }
  };

  const handleDelete = async (id: number, e: any) => {
    e.stopPropagation();
    await fetch(`${API_BASE}/podcasts/${id}`, { method: 'DELETE', headers: { 'X-Device-ID': deviceId } });
    setPodcasts(prev => prev.filter(p => p.id !== id));
    if (selectedPodcast?.id === id) { setSelectedPodcast(null); setEpisodes([]); }
    showToast('🗑️ Podcast removed');
  };

  const handleRefresh = async (id: number, e: any) => {
    e.stopPropagation();
    const res = await fetch(`${API_BASE}/podcasts/${id}/refresh`, { method: 'PATCH', headers: { 'X-Device-ID': deviceId } });
    const data = await res.json();
    showToast(`🔄 ${data.new_episodes} new episodes`);
    if (selectedPodcast?.id === id) fetchEpisodes(id);
  };

  const handlePlayEpisode = (ep: any, podcast: any) => {
    if (!ep.audio_url) { showToast('❌ No audio URL for this episode'); return; }
    playTrack({
      id: `podcast-${ep.id}`,
      title: ep.title,
      artist: podcast?.title || 'Podcast',
      coverArt: podcast?.cover_art || '',
      url: ep.audio_url,
      isLocal: true,
      localUrl: ep.audio_url,
    } as any);
  };

  return (
    <motion.div style={{ padding: '24px 24px 120px', maxWidth: 900, margin: '0 auto' }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Mic2 size={28} color="var(--accent-primary)" />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Podcasts</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>RSS feeds & audio shows</p>
        </div>
      </div>

      {/* Add RSS */}
      <div style={{
        background: 'var(--glass-bg, rgba(255,255,255,0.05))',
        border: '1px solid var(--glass-border-color, rgba(255,255,255,0.08))',
        borderRadius: 16, padding: 20, marginBottom: 24,
        display: 'flex', gap: 12
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px',
          border: '1px solid rgba(255,255,255,0.08)' }}>
          <Rss size={16} color="var(--text-secondary)" />
          <input
            type="url"
            placeholder="Paste RSS feed URL..."
            value={rssInput}
            onChange={e => setRssInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPodcast()}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.9rem' }}
          />
        </div>
        <button
          onClick={handleAddPodcast}
          disabled={addLoading}
          style={{
            background: 'var(--accent-primary)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.85rem'
          }}
        >
          <Plus size={16} />{addLoading ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Popular podcasts hint */}
      {podcasts.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>🎙️</p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No podcasts yet</p>
          <p style={{ fontSize: '0.85rem', margin: '8px 0 16px' }}>Add RSS feeds to get started</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 400, margin: '0 auto' }}>
            {[
              { name: 'Lex Fridman Podcast', url: 'https://lexfridman.com/feed/podcast/' },
              { name: 'Joe Rogan Experience', url: 'https://feeds.simplecast.com/4T39_jAj' },
              { name: 'Ted Talks Daily', url: 'https://feeds.feedburner.com/TedtalksHD' },
            ].map(p => (
              <button key={p.name} onClick={() => setRssInput(p.url)} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-secondary)',
                fontSize: '0.8rem', textAlign: 'left', transition: 'all 0.2s'
              }}>{p.name}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedPodcast ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Podcast List */}
        <div>
          {podcasts.map(podcast => (
            <motion.div key={podcast.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => { setSelectedPodcast(null); fetchEpisodes(podcast.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                background: selectedPodcast?.id === podcast.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
                borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                border: selectedPodcast?.id === podcast.id ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}
            >
              {podcast.cover_art ? (
                <img src={podcast.cover_art} alt={podcast.title} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic2 size={22} color="var(--accent-primary)" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{podcast.title}</p>
                <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{podcast.author} • {podcast.episode_count} episodes</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={e => handleRefresh(podcast.id, e)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                  <RefreshCw size={14} />
                </button>
                <button onClick={e => handleDelete(podcast.id, e)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Episode List */}
        {selectedPodcast && (
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedPodcast.title}</h3>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {episodes.map((ep, i) => (
                <motion.div key={ep.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 8,
                    border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                  onClick={() => handlePlayEpisode(ep, selectedPodcast)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: 'var(--accent-primary)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Play size={12} fill="white" color="white" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {ep.duration} {ep.pub_date && `• ${ep.pub_date.slice(0, 16)}`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-primary)', color: '#fff', padding: '10px 24px', borderRadius: 24, fontSize: '0.85rem', fontWeight: 600, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </motion.div>
  );
}
