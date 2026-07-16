// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Palette, User, Database, Download, Trash2, Bell, LogOut, Sliders } from 'lucide-react';
import { THEMES, getCurrentTheme, applyTheme, type ThemeId } from '../services/themeService';
import { API_BASE, getDeviceId } from '../api/backend';
import './Settings.css';

export default function SettingsPage() {
  const [activeTheme, setActiveTheme] = useState<ThemeId>(getCurrentTheme());
  const [profileName, setProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎵');
  const [lastfmUsername, setLastfmUsername] = useState('');
  const [lastfmPassword, setLastfmPassword] = useState('');
  const [lastfmConnected, setLastfmConnected] = useState(false);
  const [crossfade, setCrossfade] = useState(() => localStorage.getItem('aura_crossfade') === 'true');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const AVATARS = ['🎵', '🎧', '🎸', '🎹', '🥁', '🎷', '🎺', '🎻', '🎤', '🎼', '🦄', '🚀', '🔥', '⚡', '🌊', '🌙'];

  useEffect(() => {
    const deviceId = getDeviceId();
    fetch(`${API_BASE}/profile`, { headers: { 'X-Device-ID': deviceId } })
      .then(r => r.json())
      .then(data => {
        setProfileName(data.name || '');
        setSelectedAvatar(data.avatar || '🎵');
        setLastfmConnected(!!data.lastfm_username);
        if (data.lastfm_username) setLastfmUsername(data.lastfm_username);
      }).catch(() => {});
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleThemeChange = (themeId: ThemeId) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
    showToast(`✨ ${THEMES.find(t => t.id === themeId)?.name} theme applied!`);
  };

  const handleSaveProfile = async () => {
    const deviceId = getDeviceId();
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PATCH',
        headers: { 'X-Device-ID': deviceId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, avatar: selectedAvatar }),
      });
      if (!res.ok) throw new Error();
      localStorage.setItem('aura_profile_name', profileName);
      showToast('✅ Profile saved!');
    } catch { showToast('❌ Failed to save profile'); }
  };

  const handleLastfmConnect = async () => {
    if (!lastfmUsername || !lastfmPassword) return;
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const resp = await fetch(
        `${API_BASE}/lastfm/connect?username=${encodeURIComponent(lastfmUsername)}&password=${encodeURIComponent(lastfmPassword)}`,
        { method: 'POST', headers: { 'X-Device-ID': deviceId } }
      );
      const data = await resp.json();
      if (data.status === 'success') {
        setLastfmConnected(true);
        setLastfmPassword('');
        showToast('🎵 Last.fm connected!');
      } else {
        showToast(`❌ ${data.detail || 'Connection failed'}`);
      }
    } catch { showToast('❌ Failed to connect'); }
    finally { setLoading(false); }
  };

  const handleExportLibrary = async () => {
    const deviceId = getDeviceId();
    try {
      const [likes, playlists, albums, recent] = await Promise.all([
        fetch(`${API_BASE}/likes`, { headers: { 'X-Device-ID': deviceId } }).then(r => r.json()),
        fetch(`${API_BASE}/playlists`, { headers: { 'X-Device-ID': deviceId } }).then(r => r.json()),
        fetch(`${API_BASE}/albums`, { headers: { 'X-Device-ID': deviceId } }).then(r => r.json()),
        fetch(`${API_BASE}/recent`, { headers: { 'X-Device-ID': deviceId } }).then(r => r.json()),
      ]);
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), version: '2.0', likes, playlists, albums, recent }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `aura-backup-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      showToast('📦 Library exported!');
    } catch { showToast('❌ Export failed'); }
  };

  const handleLogout = () => {
    if (!confirm('Reset your profile and clear all local data?')) return;
    localStorage.removeItem('aura_device_id');
    localStorage.removeItem('aura_theme');
    localStorage.removeItem('aura_recently_played');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('aura_profile_name');
    showToast('👋 Logged out successfully');
    setTimeout(() => window.location.reload(), 1200);
  };

  const handleCrossfadeToggle = () => {
    const next = !crossfade;
    setCrossfade(next);
    localStorage.setItem('aura_crossfade', String(next));
    showToast(next ? '🎚️ Crossfade enabled' : '🎚️ Crossfade disabled');
  };

  const Section = ({ icon, title, children }: any) => (
    <div className="settings-section">
      <div className="settings-section-title">{icon} {title}</div>
      {children}
    </div>
  );

  const Row = ({ label, desc, children }: any) => (
    <div className="settings-row">
      <div>
        <div className="settings-row-label">{label}</div>
        {desc && <div className="settings-row-desc">{desc}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <motion.div className="settings-page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="settings-page-header">
        <h1>Settings</h1>
        <p>Customize your Aura Music experience</p>
      </div>

      {/* Profile */}
      <Section icon={<User size={14} />} title="Profile">
        <div className="settings-avatar-section">
          <div className="settings-avatar">{selectedAvatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {AVATARS.map(av => (
                <span key={av} onClick={() => setSelectedAvatar(av)} style={{
                  cursor: 'pointer', fontSize: '1.3rem', padding: 4, borderRadius: 8,
                  background: av === selectedAvatar ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' : 'transparent',
                  border: av === selectedAvatar ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}>{av}</span>
              ))}
            </div>
            <input
              className="settings-input"
              placeholder="Display Name"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="settings-btn primary" onClick={handleSaveProfile}>Save Profile</button>
        </div>
      </Section>

      {/* Themes */}
      <Section icon={<Palette size={14} />} title="Appearance">
        <div className="theme-grid">
          {THEMES.map(theme => (
            <div
              key={theme.id}
              className={`theme-card ${activeTheme === theme.id ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme.id)}
              style={{ background: theme.previewBg }}
            >
              <div className="theme-card-preview" style={{ background: `${theme.previewAccent2}33` }}>
                <div className="theme-preview-dot" style={{ background: theme.previewAccent }} />
                <div className="theme-preview-bar" style={{ background: `${theme.previewAccent}55` }} />
                <div className="theme-preview-dot" style={{ background: theme.previewAccent2 }} />
              </div>
              <div className="theme-card-name" style={{ color: theme.id === 'light' ? '#0f172a' : '#ffffff' }}>
                {theme.icon} {theme.name}
                {activeTheme === theme.id && <span className="theme-active-badge">Active</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Playback */}
      <Section icon={<Sliders size={14} />} title="Playback">
        <Row label="Crossfade" desc="Smooth 2-second transition between songs">
          <button
            className={`settings-toggle ${crossfade ? 'on' : ''}`}
            onClick={handleCrossfadeToggle}
          >
            <span className="settings-toggle-knob" />
          </button>
        </Row>
      </Section>

      {/* Notifications */}
      <Section icon={<Bell size={14} />} title="Notifications">
        <Row label="Song Notifications" desc="OS notifications when track changes">
          <button className="settings-btn secondary" onClick={async () => {
            if (!('Notification' in window)) { showToast('❌ Not supported'); return; }
            const perm = await Notification.requestPermission();
            showToast(perm === 'granted' ? '🔔 Notifications enabled!' : '❌ Permission denied');
          }}>Enable</button>
        </Row>
      </Section>

      {/* Last.fm */}
      <Section icon="📻" title="Last.fm Scrobbling">
        <Row label="Status" desc="">
          <span className={`settings-status ${lastfmConnected ? 'connected' : 'disconnected'}`}>
            {lastfmConnected ? '✓ Connected' : '○ Not connected'}
          </span>
        </Row>
        {lastfmConnected ? (
          <Row label="Account" desc={lastfmUsername}>
            <button className="settings-btn danger" onClick={() => { setLastfmConnected(false); showToast('Last.fm disconnected'); }}>Disconnect</button>
          </Row>
        ) : (
          <>
            <Row label="Username" desc="">
              <input className="settings-input" placeholder="Last.fm username" value={lastfmUsername} onChange={e => setLastfmUsername(e.target.value)} />
            </Row>
            <Row label="Password" desc="">
              <input className="settings-input" type="password" placeholder="••••••••" value={lastfmPassword} onChange={e => setLastfmPassword(e.target.value)} />
            </Row>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="settings-btn primary" onClick={handleLastfmConnect} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Last.fm'}
              </button>
            </div>
          </>
        )}
      </Section>

      {/* Data */}
      <Section icon={<Database size={14} />} title="Data & Backup">
        <Row label="Export Library" desc="Download all your data as JSON">
          <button className="settings-btn secondary" onClick={handleExportLibrary}>
            <Download size={13} /> Export
          </button>
        </Row>
        <Row label="Clear Play History" desc="Remove all recently played tracks">
          <button className="settings-btn danger" onClick={() => { if (confirm('Clear all play history?')) { localStorage.removeItem('aura_recently_played'); showToast('🗑️ History cleared'); } }}>
            <Trash2 size={13} /> Clear
          </button>
        </Row>
      </Section>

      {/* Logout */}
      <Section icon={<LogOut size={14} />} title="Account">
        <Row label="Sign Out" desc="Reset your profile and clear all local data">
          <button className="settings-btn danger" onClick={handleLogout}>
            <LogOut size={13} /> Logout
          </button>
        </Row>
      </Section>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.72rem', opacity: 0.5, marginTop: 32, marginBottom: 20 }}>
        Aura Music v2.0 — Built with ❤️
      </div>

      {toast && <div className="settings-toast">{toast}</div>}
    </motion.div>
  );
}
