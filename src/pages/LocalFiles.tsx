// @ts-nocheck
import { useState, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { FolderOpen, Music, Play, Trash2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import '../components/MainContent.css';
import './Library.css';

interface LocalFile {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverArt: string;
  localUrl: string; // blob URL
  isLocal: true;
}

export default function LocalFiles() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setLoading(true);

    const newFiles: LocalFile[] = [];
    for (const file of selected) {
      if (!file.type.startsWith('audio/')) continue;

      const url = URL.createObjectURL(file);

      // Extract duration using AudioContext
      let duration = '0:00';
      try {
        const audioEl = new Audio(url);
        await new Promise<void>((res) => {
          audioEl.onloadedmetadata = () => {
            const mins = Math.floor(audioEl.duration / 60);
            const secs = Math.floor(audioEl.duration % 60).toString().padStart(2, '0');
            duration = `${mins}:${secs}`;
            res();
          };
          audioEl.onerror = () => res();
        });
      } catch {}

      // Try to get cover art from ID3 tags
      let coverArt = '';
      try {
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        // Check for ID3v2 header
        if (view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
          // Has ID3v2 - basic extraction attempt
          coverArt = '';
        }
      } catch {}

      // Parse title/artist from filename
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      const parts = nameWithoutExt.split(' - ');
      const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
      const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : nameWithoutExt;

      newFiles.push({
        id: `local-${Date.now()}-${Math.random()}`,
        title,
        artist,
        duration,
        coverArt,
        localUrl: url,
        isLocal: true,
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    setLoading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePlay = (file: LocalFile) => {
    // Build a track object compatible with PlayerContext
    // Local files use localUrl for playback
    playTrack({
      id: file.id,
      title: file.title,
      artist: file.artist,
      coverArt: file.coverArt || '',
      duration: file.duration,
      localUrl: file.localUrl,
      isLocal: true,
    } as any);
  };

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <motion.main className="main-content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
      <header className="top-bar">
        <h2>Local Files</h2>
        <button className="primary-btn" onClick={() => fileInputRef.current?.click()}>
          <Upload size={18} /> Import Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
      </header>

      {files.length === 0 && !loading ? (
        <div
          className="empty-state"
          onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; }}
          onDragLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
          onDrop={async (e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
            if (files.length > 0) {
              const synth = { target: { files: { length: files.length, item: (i: number) => files[i], [Symbol.iterator]: () => files[Symbol.iterator]() } } };
              fileInputRef.current?.click();
            }
          }}
          style={{ border: '2px dashed var(--border-color)', borderRadius: 24, transition: 'border-color 0.2s', minHeight: 240 }}
        >
          <div style={{ fontSize: '4rem', marginBottom: 8 }}>🎵</div>
          <h3>No Local Files</h3>
          <p>Import MP3, FLAC, WAV files or drag & drop them here</p>
          <button className="primary-btn" style={{ marginTop: 16 }} onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import Music
          </button>
        </div>
      ) : (
        <div className="track-list">
          {loading && <p className="loading-text">Importing files...</p>}
          {files.map((file, i) => (
            <motion.div
              key={file.id}
              className={`track-list-item glass-panel ${currentTrack?.id === file.id ? 'active-card' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handlePlay(file)}
            >
              <span className="track-num">{i + 1}</span>
              <div className="track-list-art local-art">
                {file.coverArt ? (
                  <img src={file.coverArt} alt={file.title} />
                ) : (
                  <Music size={20} />
                )}
              </div>
              <div className="track-list-info">
                <span className="track-list-title">{file.title}</span>
                <span className="track-list-artist">{file.artist} • Local File</span>
              </div>
              <span className="track-list-duration">{file.duration}</span>
              <button
                className="icon-btn"
                onClick={(e) => { e.stopPropagation(); handleRemove(file.id); }}
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.main>
  );
}
