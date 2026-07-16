// @ts-nocheck
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import './KeyboardShortcuts.css';

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause' },
  { key: '→', action: 'Seek +10 seconds' },
  { key: '←', action: 'Seek -10 seconds' },
  { key: 'M', action: 'Mute / Unmute' },
  { key: 'S', action: 'Toggle Shuffle' },
  { key: 'R', action: 'Cycle Repeat Mode' },
  { key: 'N', action: 'Play Next Song' },
  { key: 'Q', action: 'Open / Close Queue' },
  { key: 'F', action: 'Full Screen Player' },
  { key: '?', action: 'Show / Hide Shortcuts' },
];

export default function KeyboardShortcuts({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="shortcuts-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="shortcuts-panel glass-panel"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-header">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="shortcuts-list">
          {SHORTCUTS.map(({ key, action }) => (
            <div className="shortcut-row" key={key}>
              <kbd className="shortcut-key">{key}</kbd>
              <span className="shortcut-action">{action}</span>
            </div>
          ))}
        </div>
        <p className="shortcuts-tip">Press <kbd>?</kbd> anywhere to toggle this panel</p>
      </motion.div>
    </motion.div>
  );
}
