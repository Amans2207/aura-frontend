// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, ListPlus, Music2, CheckCircle } from 'lucide-react';
import { searchTracks, getPlaylists, createPlaylist, addTrackToPlaylist } from '../api/backend';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';

const MOODS = [
  { label: 'Happy', icon: '😊', query: 'happy upbeat pop', color: '#f59e0b' },
  { label: 'Chill', icon: '😌', query: 'chill lofi relaxed', color: '#06b6d4' },
  { label: 'Energetic', icon: '⚡', query: 'energetic workout hype', color: '#f97316' },
  { label: 'Sad', icon: '😢', query: 'sad emotional heartbreak', color: '#6366f1' },
  { label: 'Romantic', icon: '❤️', query: 'romantic love songs', color: '#ec4899' },
  { label: 'Focus', icon: '🎯', query: 'focus study instrumental lo-fi', color: '#10b981' },
  { label: 'Party', icon: '🎉', query: 'party dance hits club', color: '#8b5cf6' },
  { label: 'Sleep', icon: '😴', query: 'sleep calm ambient relaxing', color: '#64748b' },
];

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Country', 'Indie', 'K-Pop', 'Bollywood', 'Metal'];

export default function SmartPlaylistsPage() {
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [artistInput, setArtistInput] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<any[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!selectedMood && !selectedGenre && !artistInput) {
      setError('Select a mood, genre, or enter an artist name.');
      return;
    }
    setError('');
    setLoading(true);
    setSaved(false);
    setGeneratedTracks([]);

    // Build a smart search query
    const parts: string[] = [];
    if (selectedMood) parts.push(selectedMood.query);
    if (selectedGenre) parts.push(selectedGenre);
    if (artistInput) parts.push(artistInput);
    const query = parts.join(' ');

    try {
      const tracks = await searchTracks(query);
      setGeneratedTracks(tracks.slice(0, limit));
    } catch {
      setError('Failed to generate playlist. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsPlaylist = async () => {
    if (!generatedTracks.length) return;
    setSaveLoading(true);
    try {
      const name = playlistName || `${selectedMood?.label || selectedGenre || artistInput} Mix`;
      const playlist = await createPlaylist(name);
      if (playlist?.id) {
        for (const track of generatedTracks) {
          await addTrackToPlaylist(playlist.id, track);
        }
        setSaved(true);
      }
    } catch {
      setError('Failed to save playlist');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (generatedTracks.length) {
      playTrack(generatedTracks[0]);
      navigate(`/track/${generatedTracks[0].id}`, { state: { track: generatedTracks[0] } });
    }
  };

  return (
    <motion.div
      style={{ padding: '24px 24px 120px', maxWidth: 760, margin: '0 auto', height: '100%', overflowY: 'auto' }}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={24} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>Smart Playlists</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Generate playlists instantly from mood, genre, or artist</p>
        </div>
      </div>

      {/* Config Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {/* Mood */}
        <div className="glass-panel" style={{ borderRadius: 18, padding: 20 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 14 }}>
            🎭 Choose a Mood
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {MOODS.map(mood => (
              <motion.button
                key={mood.label}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedMood(selectedMood?.label === mood.label ? null : mood)}
                style={{
                  background: selectedMood?.label === mood.label ? `${mood.color}22` : 'var(--bg-surface)',
                  border: `2px solid ${selectedMood?.label === mood.label ? mood.color : 'transparent'}`,
                  borderRadius: 14, padding: '12px 6px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s', backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{mood.icon}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>{mood.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Genre + Artist in row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="glass-panel" style={{ borderRadius: 18, padding: 18 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 12 }}>🎵 Genre</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(selectedGenre === genre ? '' : genre)}
                  style={{
                    background: selectedGenre === genre ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: selectedGenre === genre ? '#fff' : 'var(--text-secondary)',
                    border: 'none', borderRadius: 20, padding: '5px 13px', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s'
                  }}
                >{genre}</button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: 18, padding: 18 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 12 }}>🎤 Artist</div>
            <input
              placeholder="e.g. Arijit Singh..."
              value={artistInput}
              onChange={e => setArtistInput(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-surface)', border: 'var(--glass-border)', borderRadius: 10, padding: '9px 12px', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Playlist Name</div>
              <input
                placeholder="My Mix"
                value={playlistName}
                onChange={e => setPlaylistName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: 'var(--glass-border)', borderRadius: 10, padding: '9px 12px', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Songs:</span>
              {[10, 15, 20, 30].map(n => (
                <button key={n} onClick={() => setLimit(n)} style={{ padding: '4px 10px', borderRadius: 12, background: limit === n ? 'var(--accent-primary)' : 'var(--bg-surface)', color: limit === n ? '#fff' : 'var(--text-secondary)', border: 'none', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerate}
        disabled={loading}
        style={{ width: '100%', padding: '15px', background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: 16, cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, boxShadow: '0 4px 20px rgba(236,72,153,0.35)' }}
      >
        {loading ? (
          <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating...</>
        ) : (
          <><Sparkles size={18} /> Generate Smart Playlist</>
        )}
      </motion.button>

      {/* Results */}
      <AnimatePresence>
        {generatedTracks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>
                {playlistName || `${selectedMood?.label || selectedGenre || artistInput} Mix`}
                <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 10 }}>{generatedTracks.length} tracks</span>
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handlePlayAll} className="primary-btn" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                  <Play size={14} fill="white" /> Play All
                </button>
                <button
                  onClick={handleSaveAsPlaylist}
                  disabled={saveLoading || saved}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 20, border: 'var(--glass-border)', background: saved ? 'rgba(16,185,129,0.15)' : 'var(--bg-surface)', color: saved ? '#10b981' : 'var(--text-primary)', cursor: saved ? 'default' : 'pointer' }}
                >
                  {saved ? <><CheckCircle size={14} /> Saved!</> : saveLoading ? 'Saving...' : <><ListPlus size={14} /> Save Playlist</>}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {generatedTracks.map((track, i) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-panel"
                  onClick={() => { playTrack(track); navigate(`/track/${track.id}`, { state: { track } }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 14, cursor: 'pointer', transition: 'background 0.18s' }}
                >
                  <span style={{ width: 24, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{i + 1}</span>
                  <img src={track.coverArt} alt={track.title} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{track.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{track.artist}</div>
                  </div>
                  <Music2 size={16} color="var(--text-secondary)" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
