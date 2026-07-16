// @ts-nocheck
import { useRef } from 'react';
import Draggable from 'react-draggable';
import { SkipBack, Play, Pause, SkipForward, X, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import './MiniPlayer.css';

interface MiniPlayerProps {
  onClose: () => void;
}

export default function MiniPlayer({ onClose }: MiniPlayerProps) {
  const { currentTrack, isPlaying, togglePlayPause, playNext, playPrev, progress, duration } = usePlayer();
  const nodeRef = useRef<HTMLDivElement>(null);

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <Draggable nodeRef={nodeRef} handle=".mini-player-drag-handle" defaultPosition={{ x: window.innerWidth - 360, y: 80 }} bounds="body">
      <div ref={nodeRef} className="mini-player">
        <div className="mini-player-drag-handle">
          <div className="mini-drag-dots">
            {[...Array(6)].map((_, i) => <span key={i} />)}
          </div>
          <button className="mini-player-close" onClick={onClose} title="Close Mini Player">
            <X size={14} />
          </button>
        </div>

        <div className="mini-player-body">
          {currentTrack?.coverArt ? (
            <img className="mini-player-cover" src={currentTrack.coverArt} alt={currentTrack.title} />
          ) : (
            <div className="mini-player-cover-placeholder">
              <Music2 size={22} />
            </div>
          )}

          <div className="mini-player-info">
            <p className="mini-player-title">{currentTrack?.title || 'No Track'}</p>
            <p className="mini-player-artist">{currentTrack?.artist || 'Select a song'}</p>
          </div>

          <div className="mini-player-controls">
            <button className="mini-ctrl-btn" onClick={playPrev} title="Previous">
              <SkipBack size={15} />
            </button>
            <button className="mini-ctrl-btn play" onClick={togglePlayPause} title="Play/Pause">
              {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            </button>
            <button className="mini-ctrl-btn" onClick={playNext} title="Next">
              <SkipForward size={15} />
            </button>
          </div>
        </div>

        <div className="mini-progress-bar">
          <div className="mini-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </Draggable>
  );
}
