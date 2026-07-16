import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useLikedTracks } from '../context/LikedTracksContext';
import { searchTracks, getBackendLyrics, getStreamUrl, API_BASE } from '../api/backend';
import type { Track } from '../data/tracks';
import Visualizer from '../components/Visualizer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Share2, ListPlus, ArrowLeft, Download, Play, Pause,
  Maximize2, X, Music2, Sparkles, Radio, ChevronRight
} from 'lucide-react';
import './TrackDetails.css';

// ─── Branded Video Player (no YouTube UI) ───────────────────────────────────
function AuraVideoPlayer({ videoId, title, artist, onClose }: {
  videoId: string; title: string; artist: string; onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`${API_BASE}/video/url?video_id=${videoId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setVideoUrl(d.url); setLoading(false); })
      .catch(() => setError(true));
  }, [videoId]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlayingVideo) { videoRef.current.pause(); setIsPlayingVideo(false); }
    else { videoRef.current.play(); setIsPlayingVideo(true); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const t = (Number(e.target.value) / 100) * videoDuration;
    videoRef.current.currentTime = t;
    setVideoProgress(Number(e.target.value));
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <motion.div className="aura-video-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="aura-video-shell"
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="aura-video-header">
          <div className="aura-video-branding">
            <Sparkles size={16} className="aura-spark" />
            <span>Aura Music</span>
          </div>
          <div className="aura-video-track-name">
            <span>{title}</span>
            <span className="aura-video-dot">·</span>
            <span className="aura-video-artist">{artist}</span>
          </div>
          <button className="aura-video-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Video area */}
        <div className="aura-video-area" onClick={togglePlay}>
          {loading && (
            <div className="aura-video-loader">
              <div className="aura-spinner" />
              <p>Loading video…</p>
            </div>
          )}
          {error && (
            <div className="aura-video-loader">
              <Music2 size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
              <p style={{ opacity: 0.7 }}>Video unavailable for this track.</p>
              <p style={{ opacity: 0.4, fontSize: '0.8rem' }}>Audio is still playing in the background.</p>
            </div>
          )}
          {videoUrl && !error && (
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedData={() => setLoading(false)}
              onPlay={() => setIsPlayingVideo(true)}
              onPause={() => setIsPlayingVideo(false)}
              onTimeUpdate={() => {
                if (videoRef.current && videoRef.current.duration) {
                  setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
                  setVideoDuration(videoRef.current.duration);
                }
              }}
              autoPlay
              playsInline
              controlsList="nodownload nofullscreen"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: loading ? 'none' : 'block' }}
            />
          )}
          {/* Play overlay */}
          {!loading && !error && (
            <div className={`aura-video-play-overlay ${isPlayingVideo ? 'hidden' : ''}`}>
              <div className="aura-big-play"><Play size={32} fill="white" /></div>
            </div>
          )}
        </div>

        {/* Custom controls */}
        {!loading && !error && videoUrl && (
          <div className="aura-video-controls">
            <span className="aura-video-time">{fmt(videoRef.current?.currentTime || 0)}</span>
            <input
              type="range" className="aura-video-seek"
              min={0} max={100} value={videoProgress}
              onChange={handleSeek}
            />
            <span className="aura-video-time">{fmt(videoDuration)}</span>
            <button className="aura-ctrl-btn" onClick={togglePlay}>
              {isPlayingVideo ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main TrackDetails Page ───────────────────────────────────────────────────
export default function TrackDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, addToQueue, togglePlayPause } = usePlayer();
  const { likedTracks, toggleLike } = useLikedTracks();
  const isLiked = likedTracks.some(t => t.id === id);

  const initialTrack = location.state?.track as Track | undefined;
  const [track, setTrack] = useState<Track | null>(initialTrack || null);
  const [lyrics, setLyrics] = useState<string>('');
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [similarTracks, setSimilarTracks] = useState<Track[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [videoTrack, setVideoTrack] = useState<Track | null>(null);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'similar' | 'radio'>('lyrics');
  const [downloading, setDownloading] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>('102, 51, 153');
  const [radioTracks, setRadioTracks] = useState<Track[]>([]);
  const [loadingRadio, setLoadingRadio] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  useEffect(() => {
    if (!track && currentTrack?.id === id) setTrack(currentTrack);
  }, [id, currentTrack, track]);

  // Extract color from album art
  useEffect(() => {
    if (!track?.coverArt) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = track.coverArt;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setDominantColor(`${r}, ${g}, ${b}`);
      } catch { /* ignore CORS errors */ }
    };
  }, [track?.coverArt]);

  useEffect(() => {
    if (!track) return;
    setLyricsLoading(true);
    getBackendLyrics(track.id).then(l => { setLyrics(l); setLyricsLoading(false); });

    setLoadingSimilar(true);
    searchTracks(track.artist).then(res => {
      setSimilarTracks(res.filter(t => t.id !== track.id).slice(0, 12));
      setLoadingSimilar(false);
    });
  }, [track]);

  const loadRadio = async () => {
    if (!track || radioTracks.length > 0) return;
    setLoadingRadio(true);
    try {
      const res = await fetch(`${API_BASE}/radio?video_id=${track.id}`);
      const data = await res.json();
      setRadioTracks(data.slice(0, 15));
    } catch { /* silent */ }
    setLoadingRadio(false);
  };

  const handleTabChange = (tab: 'lyrics' | 'similar' | 'radio') => {
    setActiveTab(tab);
    if (tab === 'radio') loadRadio();
  };

  const handleDownload = async () => {
    if (!track) return;
    setDownloading(true);
    showToast('Starting download…');
    try {
      // Try backend download first (proxied, no YouTube branding)
      const url = `${API_BASE}/download/${track.id}?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.artist} - ${track.title}.m4a`;
      a.click();
    } catch {
      // Fallback: fetch stream URL and download from there
      const streamUrl = await getStreamUrl(track.id, track.title, track.artist);
      if (streamUrl) {
        const a = document.createElement('a');
        a.href = streamUrl;
        a.download = `${track.artist} - ${track.title}.m4a`;
        a.click();
      } else {
        showToast('Download failed. Try again later.');
      }
    }
    setDownloading(false);
  };

  const isCurrentTrack = currentTrack?.id === track?.id;

  if (!track) {
    return (
      <div className="td-page td-not-found">
        <button className="td-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back
        </button>
        <Music2 size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h3>Track not found</h3>
        <p>Try searching for this track from the home page.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="td-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      {/* Ambient background glow from album art color */}
      <div
        className="td-ambient-bg"
        style={{ background: `radial-gradient(ellipse at top left, rgba(${dominantColor}, 0.35) 0%, transparent 65%)` }}
      />

      {/* ── Top bar ── */}
      <div className="td-topbar">
        <button className="td-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* ── Hero Section ── */}
      <div className="td-hero">
        {/* Album art with animated ring */}
        <div className="td-art-wrap">
          <div className={`td-art-ring ${isCurrentTrack && isPlaying ? 'spinning' : ''}`} />
          <div
            className="td-art"
            style={{ backgroundImage: `url(${track.coverArt})` }}
            onClick={() => isCurrentTrack ? togglePlayPause() : playTrack(track)}
          >
            <div className={`td-art-overlay ${isCurrentTrack && isPlaying ? 'td-art-overlay-active' : ''}`}>
              {isCurrentTrack && isPlaying
                ? <Pause size={36} fill="white" color="white" />
                : <Play size={36} fill="white" color="white" />
              }
            </div>
          </div>
        </div>

        {/* Track info + actions */}
        <div className="td-hero-info">
          <div className="td-meta">
            <span className="td-label">🎵 Now on Aura</span>
          </div>
          <h1 className="td-title">{track.title}</h1>
          <p className="td-artist">{track.artist}</p>

          {/* Visualizer when playing */}
          {isCurrentTrack && isPlaying && (
            <div className="td-visualizer-wrap">
              <Visualizer />
            </div>
          )}

          {/* Action buttons */}
          <div className="td-actions">
            <button
              id="td-play-btn"
              className={`td-btn td-btn-primary ${isCurrentTrack && isPlaying ? 'td-btn-playing' : ''}`}
              onClick={() => isCurrentTrack ? togglePlayPause() : playTrack(track)}
            >
              {isCurrentTrack && isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} fill="currentColor" /> Play</>}
            </button>

            <button
              id="td-like-btn"
              className={`td-btn td-btn-icon ${isLiked ? 'td-btn-liked' : ''}`}
              onClick={() => { toggleLike(track); showToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs'); }}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            </button>

            <button
              id="td-queue-btn"
              className="td-btn td-btn-icon"
              onClick={() => { addToQueue(track); showToast('Added to queue'); }}
              title="Add to Queue"
            >
              <ListPlus size={18} />
            </button>

            <button
              id="td-download-btn"
              className={`td-btn td-btn-icon ${downloading ? 'td-btn-loading' : ''}`}
              onClick={handleDownload}
              title="Download"
              disabled={downloading}
            >
              <Download size={18} />
            </button>

            <button
              id="td-share-btn"
              className="td-btn td-btn-icon"
              title="Share"
              onClick={async () => {
                const url = window.location.href;
                if (navigator.share) {
                  await navigator.share({ title: track.title, text: `Listen to ${track.title} by ${track.artist} on Aura Music`, url });
                } else {
                  await navigator.clipboard.writeText(url);
                  showToast('Link copied!');
                }
              }}
            >
              <Share2 size={18} />
            </button>

            <button
              id="td-video-btn"
              className="td-btn td-btn-video"
              onClick={() => setVideoTrack(track)}
              title="Watch Video"
            >
              <Maximize2 size={16} /> Watch Video
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="td-tabs">
        {(['lyrics', 'similar', 'radio'] as const).map(tab => (
          <button
            key={tab}
            id={`td-tab-${tab}`}
            className={`td-tab ${activeTab === tab ? 'td-tab-active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab === 'lyrics' && <Music2 size={15} />}
            {tab === 'similar' && <ChevronRight size={15} />}
            {tab === 'radio' && <Radio size={15} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'similar' && ` by ${track.artist.split(' ')[0]}`}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'lyrics' && (
          <motion.div
            key="lyrics"
            className="td-content-panel glass-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {lyricsLoading ? (
              <div className="td-loading">
                <div className="td-loading-dots"><span/><span/><span/></div>
                <p>Loading lyrics…</p>
              </div>
            ) : lyrics && lyrics !== 'Lyrics not available for this track.' ? (
              <pre className="td-lyrics">{lyrics}</pre>
            ) : (
              <div className="td-empty-state">
                <Music2 size={36} style={{ opacity: 0.3 }} />
                <p>Lyrics not available for this track.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'similar' && (
          <motion.div
            key="similar"
            className="td-content-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {loadingSimilar ? (
              <div className="td-loading"><div className="td-loading-dots"><span/><span/><span/></div></div>
            ) : (
              <div className="td-track-list">
                {similarTracks.map((sim, i) => (
                  <motion.div
                    key={sim.id}
                    className={`td-track-row ${currentTrack?.id === sim.id ? 'td-track-row-active' : ''}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => playTrack(sim)}
                  >
                    <span className="td-track-num">{i + 1}</span>
                    <img className="td-track-art" src={sim.coverArt} alt={sim.title} />
                    <div className="td-track-info">
                      <span className="td-track-title">{sim.title}</span>
                      <span className="td-track-artist">{sim.artist}</span>
                    </div>
                    <div className="td-track-actions" onClick={e => e.stopPropagation()}>
                      <button className="td-row-btn" onClick={() => playTrack(sim)} title="Play Audio"><Play size={14} /></button>
                      <button className="td-row-btn td-row-btn-video" onClick={() => setVideoTrack(sim)} title="Watch Video"><Maximize2 size={14} /></button>
                      <button className="td-row-btn" onClick={() => { addToQueue(sim); showToast('Added to queue'); }} title="Add to Queue"><ListPlus size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'radio' && (
          <motion.div
            key="radio"
            className="td-content-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {loadingRadio ? (
              <div className="td-loading"><div className="td-loading-dots"><span/><span/><span/></div></div>
            ) : radioTracks.length === 0 ? (
              <div className="td-empty-state">
                <Radio size={36} style={{ opacity: 0.3 }} />
                <p>Radio unavailable. Try again later.</p>
              </div>
            ) : (
              <div className="td-track-list">
                {radioTracks.map((r, i) => (
                  <motion.div
                    key={r.id}
                    className={`td-track-row ${currentTrack?.id === r.id ? 'td-track-row-active' : ''}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => playTrack(r)}
                  >
                    <span className="td-track-num">{i + 1}</span>
                    <img className="td-track-art" src={r.coverArt} alt={r.title} />
                    <div className="td-track-info">
                      <span className="td-track-title">{r.title}</span>
                      <span className="td-track-artist">{r.artist}</span>
                    </div>
                    <div className="td-track-actions" onClick={e => e.stopPropagation()}>
                      <button className="td-row-btn" onClick={() => playTrack(r)} title="Play"><Play size={14} /></button>
                      <button className="td-row-btn" onClick={() => { addToQueue(r); showToast('Added to queue'); }} title="Queue"><ListPlus size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            className="td-toast"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Branded Video Player ── */}
      <AnimatePresence>
        {videoTrack && (
          <AuraVideoPlayer
            videoId={videoTrack.id}
            title={videoTrack.title}
            artist={videoTrack.artist}
            onClose={() => setVideoTrack(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
