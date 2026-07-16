import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PlayerProvider } from './context/PlayerContext.tsx';
import { LikedTracksProvider } from './context/LikedTracksContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { initTheme } from './services/themeService.ts';

// Apply theme immediately to prevent FOUC (Flash of Unstyled Content)
initTheme();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PlayerProvider>
        <LikedTracksProvider>
          <App />
        </LikedTracksProvider>
      </PlayerProvider>
    </BrowserRouter>
  </StrictMode>,
);
