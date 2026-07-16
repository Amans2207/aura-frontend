import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Track } from '../data/tracks';
import { API_BASE } from '../api/backend';

interface LikedTracksContextType {
  likedTracks: Track[];
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
}

const LikedTracksContext = createContext<LikedTracksContextType | undefined>(undefined);

export function LikedTracksProvider({ children }: { children: ReactNode }) {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  
  // Generate or retrieve device ID for anonymous syncing
  const getDeviceId = () => {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('device_id', id);
    }
    return id;
  };

  const deviceId = getDeviceId();

  useEffect(() => {
    // Fetch from DB
    fetch(`${API_BASE}/likes`, {
      headers: { 'X-Device-ID': deviceId }
    })
    .then(res => res.json())
    .then(data => setLikedTracks(data))
    .catch(e => {
      console.error('Failed to fetch from DB, falling back to local storage', e);
      const saved = localStorage.getItem('likedTracks');
      if (saved) {
        try { setLikedTracks(JSON.parse(saved)); } catch (e) {}
      }
    });
  }, [deviceId]);

  const toggleLike = (track: Track) => {
    const isCurrentlyLiked = isLiked(track.id);
    
    // Optimistic UI update
    setLikedTracks(prev => {
      const updated = isCurrentlyLiked 
        ? prev.filter(t => t.id !== track.id)
        : [...prev, track];
        
      localStorage.setItem('likedTracks', JSON.stringify(updated));
      return updated;
    });

    // Backend update
    if (isCurrentlyLiked) {
      fetch(`${API_BASE}/like/${track.id}`, {
        method: 'DELETE',
        headers: { 'X-Device-ID': deviceId }
      }).catch(e => console.error(e));
    } else {
      fetch(`${API_BASE}/like`, {
        method: 'POST',
        headers: {
          'X-Device-ID': deviceId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(track)
      }).catch(e => console.error(e));
    }
  };

  const isLiked = (trackId: string) => {
    return likedTracks.some(t => t.id === trackId);
  };

  return (
    <LikedTracksContext.Provider value={{ likedTracks, toggleLike, isLiked }}>
      {children}
    </LikedTracksContext.Provider>
  );
}

export function useLikedTracks() {
  const context = useContext(LikedTracksContext);
  if (context === undefined) {
    throw new Error('useLikedTracks must be used within a LikedTracksProvider');
  }
  return context;
}
