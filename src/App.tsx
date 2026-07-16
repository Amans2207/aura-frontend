import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import TrackDetails from './pages/TrackDetails';
import LikedSongs from './pages/LikedSongs';
import Explore from './pages/Explore';
import Artist from './pages/Artist';
import Playlists from './pages/Playlists';
import Albums from './pages/Albums';
import ArtistsPage from './pages/ArtistsPage';
import LocalFiles from './pages/LocalFiles';
import RecentlyPlayed from './pages/RecentlyPlayed';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/Settings';
import PodcastsPage from './pages/Podcasts';
import SmartPlaylistsPage from './pages/SmartPlaylists';
import ListeningSessionPage from './pages/ListeningSession';
import ProfilePage from './pages/Profile';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PlayerBar from './components/PlayerBar';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { initTheme } from './services/themeService';
import './App.css';

function AppContent() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Initialize theme on mount
  useEffect(() => { initTheme(); }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Top Bar */}
      <div className="mobile-header glass-panel">
        <button className="icon-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <h1 className="text-gradient" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Aura Music</h1>
        <div style={{width: 24}}></div>
      </div>

      <div className="main-layout">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
        <div className="page-wrapper">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/track/:id" element={<TrackDetails />} />
              <Route path="/artist/:name" element={<Artist />} />
              <Route path="/liked" element={<LikedSongs />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/artists" element={<ArtistsPage />} />
              <Route path="/local-files" element={<LocalFiles />} />
              <Route path="/recent" element={<RecentlyPlayed />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/podcasts" element={<PodcastsPage />} />
              <Route path="/smart-playlists" element={<SmartPlaylistsPage />} />
              <Route path="/session" element={<ListeningSessionPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </AnimatePresence>
          
          {deferredPrompt && (
            <div className="install-banner glass-panel" style={{ position: 'fixed', bottom: '100px', right: '20px', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px' }}>
              <div>
                <h4 style={{ margin: 0 }}>Install Aura Music</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Get the app for a better experience</p>
              </div>
              <button className="primary-btn" onClick={handleInstallClick} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Install
              </button>
            </div>
          )}
        </div>
      </div>
      <PlayerBar />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
