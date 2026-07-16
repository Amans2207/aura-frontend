// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Heart, Music2, Clock, Star, Edit3, Check } from 'lucide-react';
import { API_BASE, getDeviceId } from '../api/backend';
import { useLikedTracks } from '../context/LikedTracksContext';
import { useNavigate } from 'react-router-dom';

const AVATARS = ['🎵', '🎧', '🎸', '🎹', '🥁', '🎷', '🎺', '🎻', '🎤', '🎼', '🦄', '🚀', '🔥', '⚡', '🌊', '🌙', '🌈', '🦋', '🐉', '👾'];

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: 'Guest User', avatar: '🎵' });
  const [editName, setEditName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const { likedTracks } = useLikedTracks();
  const navigate = useNavigate();

  const recentlyPlayed: any[] = JSON.parse(localStorage.getItem('aura_recently_played') || '[]');
  const totalPlays = parseInt(localStorage.getItem('aura_total_plays') || '0', 10);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    const deviceId = getDeviceId();
    fetch(`${API_BASE}/profile`, { headers: { 'X-Device-ID': deviceId } })
      .then(r => r.json())
      .then(d => {
        const p = { name: d.name || 'Guest User', avatar: d.avatar || '🎵' };
        setProfile(p);
        setEditName(p.name);
        localStorage.setItem('aura_profile_name', p.name);
      }).catch(() => { setEditName('Guest User'); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const deviceId = getDeviceId();
      await fetch(`${API_BASE}/profile`, {
        method: 'PATCH',
        headers: { 'X-Device-ID': deviceId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, avatar: profile.avatar }),
      });
      setProfile(p => ({ ...p, name: editName }));
      localStorage.setItem('aura_profile_name', editName);
      setEditMode(false);
      showToast('✅ Profile saved!');
    } catch { showToast('❌ Save failed'); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = async (av: string) => {
    setProfile(p => ({ ...p, avatar: av }));
    const deviceId = getDeviceId();
    try {
      await fetch(`${API_BASE}/profile`, {
        method: 'PATCH',
        headers: { 'X-Device-ID': deviceId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, avatar: av }),
      });
    } catch {}
  };

  const stats = [
    { icon: <Heart size={20} />, label: 'Liked Songs', value: likedTracks.length, color: '#ec4899' },
    { icon: <Music2 size={20} />, label: 'Total Plays', value: totalPlays, color: '#8b5cf6' },
    { icon: <Clock size={20} />, label: 'Recently Played', value: recentlyPlayed.length, color: '#0ea5e9' },
    { icon: <Star size={20} />, label: 'Playlists', value: '—', color: '#f59e0b' },
  ];

  return (
    <motion.div
      className="main-content"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ paddingBottom: 120 }}
    >
      {/* Hero Banner */}
      <div style={{
        background: 'var(--accent-gradient)',
        borderRadius: 24, padding: '36px 28px 70px',
        marginBottom: -50, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'4\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.4 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Your Profile</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>Customize your Aura Music experience</p>
        </div>
      </div>

      {/* Profile Card */}
      <div style={{ padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div className="glass-panel" style={{ borderRadius: 24, padding: '28px 24px', marginBottom: 24 }}>
          {/* Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', border: '4px solid var(--bg-elevated)',
              boxShadow: '0 4px 20px rgba(236,72,153,0.35)', flexShrink: 0,
            }}>
              {profile.avatar}
            </div>
            <div style={{ flex: 1 }}>
              {editMode ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: 'var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none' }}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                  />
                  <button onClick={handleSave} disabled={saving} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-gradient)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{profile.name}</h2>
                  <button onClick={() => setEditMode(true)} style={{ padding: 4, borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>Aura Music Listener</p>
            </div>
          </div>

          {/* Avatar Picker */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Choose Avatar</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVATARS.map(av => (
                <button
                  key={av}
                  onClick={() => handleAvatarChange(av)}
                  style={{
                    fontSize: '1.5rem', padding: '6px', borderRadius: 10, cursor: 'pointer',
                    background: av === profile.avatar ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' : 'transparent',
                    border: av === profile.avatar ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    transition: 'all 0.15s', lineHeight: 1,
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="glass-panel"
              whileHover={{ scale: 1.02 }}
              style={{ borderRadius: 18, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="glass-panel" style={{ borderRadius: 20, overflow: 'hidden' }}>
          {[
            { label: 'Liked Songs', icon: '❤️', path: '/liked' },
            { label: 'Playlists', icon: '🎶', path: '/playlists' },
            { label: 'Settings', icon: '⚙️', path: '/settings' },
          ].map((item, i) => (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', borderBottom: i < 2 ? 'var(--glass-border)' : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
              <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.label}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>›</span>
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="settings-toast">{toast}</div>}
    </motion.div>
  );
}
