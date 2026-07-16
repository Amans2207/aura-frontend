// @ts-nocheck
import { usePlayer } from '../context/PlayerContext';
import { X, Trash2, Play, ListMusic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './QueuePanel.css';

export default function QueuePanel({ onClose }: { onClose: () => void }) {
  const { queue, removeFromQueue, clearQueue, playTrack, currentTrack, isPlaying } = usePlayer();

  return (
    <motion.div
      className="queue-panel glass-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="queue-header">
        <div className="queue-title">
          <ListMusic size={20} />
          <h3>Up Next</h3>
          {queue.length > 0 && <span className="queue-count">{queue.length}</span>}
        </div>
        <div className="queue-actions">
          {queue.length > 0 && (
            <button className="icon-btn danger-btn" onClick={clearQueue} title="Clear Queue">
              <Trash2 size={16} />
            </button>
          )}
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
      </div>

      {currentTrack && (
        <div className="now-playing-section">
          <p className="section-label">NOW PLAYING</p>
          <div className="queue-item active-queue-item">
            <img src={currentTrack.coverArt} alt={currentTrack.title} className="queue-art" />
            <div className="queue-info">
              <span className="queue-title-text">{currentTrack.title}</span>
              <span className="queue-artist">{currentTrack.artist}</span>
            </div>
            <div className="playing-indicator">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      <div className="queue-list-section">
        <p className="section-label">QUEUE ({queue.length})</p>
        {queue.length === 0 ? (
          <div className="queue-empty">
            <ListMusic size={40} opacity={0.3} />
            <p>Queue is empty</p>
            <span>Add songs by right-clicking or using ⋯ menu</span>
          </div>
        ) : (
          <div className="queue-list">
            <AnimatePresence>
              {queue.map((track, i) => (
                <motion.div
                  key={`${track.id}-${i}`}
                  className="queue-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => playTrack(track)}
                >
                  <span className="queue-num">{i + 1}</span>
                  <img src={track.coverArt} alt={track.title} className="queue-art" />
                  <div className="queue-info">
                    <span className="queue-title-text">{track.title}</span>
                    <span className="queue-artist">{track.artist}</span>
                  </div>
                  <button 
                    className="icon-btn remove-queue-btn" 
                    onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
