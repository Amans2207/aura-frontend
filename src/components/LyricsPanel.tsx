// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getBackendLyrics, API_BASE } from '../api/backend';
import './LyricsPanel.css';

interface LyricsLine {
  time: number; // seconds
  text: string;
}

/**
 * Parse LRC format lyrics into timed lines
 * Format: [mm:ss.xx] lyric text
 */
function parseLRC(lrc: string): LyricsLine[] | null {
  const lines: LyricsLine[] = [];
  const pattern = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/g;
  let match;
  while ((match = pattern.exec(lrc)) !== null) {
    const mins = parseInt(match[1]);
    const secs = parseInt(match[2]);
    const ms = parseInt(match[3] || '0') / 1000;
    const text = match[4].trim();
    if (text) {
      lines.push({ time: mins * 60 + secs + ms, text });
    }
  }
  return lines.length > 0 ? lines.sort((a, b) => a.time - b.time) : null;
}

interface LyricsPanelProps {
  onClose: () => void;
}

export default function LyricsPanel({ onClose }: LyricsPanelProps) {
  const { currentTrack, progress } = usePlayer();
  const [lyrics, setLyrics] = useState<string>('');
  const [lrcLines, setLrcLines] = useState<LyricsLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack) return;
    setLoading(true);
    setLyrics('');
    setLrcLines(null);
    setActiveIdx(0);

    getBackendLyrics(currentTrack.id).then(text => {
      setLoading(false);
      if (!text || text === 'Lyrics not available.') {
        setLyrics('Lyrics not available for this track.');
        return;
      }
      // Try to parse as LRC
      const parsed = parseLRC(text);
      if (parsed && parsed.length > 3) {
        setLrcLines(parsed);
      } else {
        setLyrics(text);
      }
    });
  }, [currentTrack?.id]);

  // Sync active line with playback progress
  useEffect(() => {
    if (!lrcLines || lrcLines.length === 0) return;
    let idx = 0;
    for (let i = 0; i < lrcLines.length; i++) {
      if (lrcLines[i].time <= progress) idx = i;
      else break;
    }
    setActiveIdx(idx);
  }, [progress, lrcLines]);

  // Auto-scroll active line into view
  useEffect(() => {
    const el = lineRefs.current[activeIdx];
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIdx]);

  return (
    <div className="lyrics-panel">
      <div className="lyrics-panel-header">
        <h3>
          <span className="lyrics-icon">🎵</span>
          Lyrics
          {currentTrack && (
            <span className="lyrics-source-badge">YouTube Music</span>
          )}
        </h3>
        <button className="lyrics-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="lyrics-scroll-area" ref={scrollRef}>
        {!currentTrack ? (
          <div className="lyrics-no-track">
            <p>🎤</p>
            <p>Play a song to see lyrics</p>
          </div>
        ) : loading ? (
          <div className="lyrics-loading">
            <div className="lyrics-loading-spinner" />
            <p>Fetching lyrics...</p>
          </div>
        ) : lrcLines ? (
          // Synced LRC lyrics
          <div style={{ textAlign: 'center' }}>
            {lrcLines.map((line, i) => (
              <span
                key={i}
                ref={el => (lineRefs.current[i] = el)}
                className={`lyrics-line ${i === activeIdx ? 'active' : i < activeIdx ? 'passed' : ''}`}
              >
                {line.text}
              </span>
            ))}
          </div>
        ) : (
          // Plain text lyrics
          <pre className="lyrics-text">{lyrics}</pre>
        )}
      </div>
    </div>
  );
}
