// @ts-nocheck
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Compass, Heart, ListMusic, Disc3, Mic2, FolderDown, X,
  Clock, BarChart3, Settings, Sparkles, Radio, Users, LogOut, User, Shield
} from 'lucide-react';
import { API_BASE, getDeviceId } from '../api/backend';
import './Sidebar.css';

interface SidebarProps {
  isOpen?: boolean;
  closeSidebar?: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: 'Guest User', avatar: '🎵', is_admin: false, is_pro: false });

  useEffect(() => {
    import('../api/backend').then(({ apiFetch, API_BASE }) => {
      apiFetch(`${API_BASE}/profile`)
        .then(r => r.json())
        .then(d => {
          if (d.name || d.avatar) {
            setProfile({ 
              name: d.name || 'Guest User', 
              avatar: d.avatar || '🎵', 
              is_admin: d.is_admin || false,
              is_pro: d.is_pro || false
            });
          }
        }).catch(() => {});
    });
  }, []);

  const handleLogout = async () => {
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
    localStorage.removeItem('aura_device_id');
    localStorage.removeItem('aura_theme');
    localStorage.removeItem('aura_recently_played');
    setProfile({ name: 'Guest User', avatar: '🎵', is_admin: false, is_pro: false });
    if (closeSidebar) closeSidebar();
    window.location.reload();
  };


  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎵</div>
          <h1 className="text-gradient sidebar-logo-text">Aura Music</h1>
          {isOpen && (
            <button className="icon-btn sidebar-close-btn" onClick={closeSidebar}><X size={18} /></button>
          )}
        </div>

        {/* Navigation */}
        <nav className="nav-menu">
          <div className="nav-section">
            <p className="section-label">Menu</p>
            <ul>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Home size={17} /> Home</li>
              </NavLink>
              <NavLink to="/explore" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Compass size={17} /> Explore</li>
              </NavLink>
              <NavLink to="/liked" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Heart size={17} /> Liked Songs</li>
              </NavLink>
              <NavLink to="/recent" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Clock size={17} /> Recently Played</li>
              </NavLink>
              <NavLink to="/stats" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><BarChart3 size={17} /> Your Stats</li>
              </NavLink>
              <NavLink to="/smart-playlists" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Sparkles size={17} /> Smart Playlists</li>
              </NavLink>
              <NavLink to="/session" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Users size={17} /> Listen Together</li>
              </NavLink>
            </ul>
          </div>

          <div className="nav-section">
            <p className="section-label">Library</p>
            <ul>
              <NavLink to="/playlists" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><ListMusic size={17} /> Playlists</li>
              </NavLink>
              <NavLink to="/albums" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Disc3 size={17} /> Albums</li>
              </NavLink>
              <NavLink to="/artists" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Mic2 size={17} /> Artists</li>
              </NavLink>
              <NavLink to="/local-files" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><FolderDown size={17} /> Local Files</li>
              </NavLink>
              <NavLink to="/podcasts" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <li><Radio size={17} /> Podcasts</li>
              </NavLink>
            </ul>
          </div>
          {profile.is_admin && (
            <NavLink to="/admin" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
              <Shield size={20} />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* User Profile */}
        <div className="sidebar-footer">
          {profile.name === 'Guest User' ? (
            <NavLink to="/login" className="user-profile" onClick={closeSidebar} style={{ justifyContent: 'center', background: 'var(--accent-primary)', color: 'white' }}>
              <span style={{ fontWeight: 600 }}>Login to Aura</span>
            </NavLink>
          ) : (
            <NavLink to="/profile" className="user-profile" onClick={closeSidebar}>
              <div className="avatar">{profile.avatar}</div>
              <div className="user-info">
                <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {profile.name} 
                  {profile.is_pro && <span style={{ background: 'var(--accent-gradient)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 8, fontWeight: 800 }}>PRO</span>}
                </span>
                <span className="user-role">Tap to customize</span>
              </div>
            </NavLink>
          )}
          <div className="sidebar-footer-actions">
            <NavLink to="/settings" title="Settings" onClick={closeSidebar}>
              <button className="icon-btn"><Settings size={17} /></button>
            </NavLink>
            <button className="icon-btn logout-btn" title="Logout / Reset" onClick={handleLogout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
