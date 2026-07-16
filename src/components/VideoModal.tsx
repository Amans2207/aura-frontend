// @ts-nocheck
import { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../api/backend';
import './VideoModal.css';

interface VideoModalProps {
  videoId: string;
  title: string;
  artist: string;
  onClose: () => void;
}

export default function VideoModal({ videoId, title, artist, onClose }: VideoModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const youtubeUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&color=white`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <motion.div
      className="video-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="video-modal-content"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="video-modal-header">
          <div>
            <h3 className="video-modal-title">{title}</h3>
            <p className="video-modal-artist">{artist}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Watch on YouTube"
              style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', padding: '6px' }}
            >
              <ExternalLink size={18} />
            </a>
            <button className="icon-btn video-close-btn" onClick={onClose}><X size={22} /></button>
          </div>
        </div>

        <div className="video-iframe-wrap" style={{ position: 'relative' }}>
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 12, zIndex: 2
            }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
          <iframe
            src={youtubeUrl}
            title={`${title} - ${artist}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
          />
        </div>

        <div className="video-modal-actions">
          <a
            className="yt-open-btn secondary-yt"
            href={`${API_BASE}/download/${videoId}?type=audio`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download size={16} /> Download Audio
          </a>
          <a
            className="yt-open-btn secondary-yt"
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#ff0000', color: 'white' }}
          >
            <ExternalLink size={16} /> Open on YouTube
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
