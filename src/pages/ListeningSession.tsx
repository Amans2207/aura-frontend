// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Copy, Play, Pause, Music2, MessageCircle, Send, Check, X, Radio } from 'lucide-react';
import { API_BASE, getDeviceId } from '../api/backend';
import { usePlayer } from '../context/PlayerContext';

export default function ListeningSessionPage() {
  const [mode, setMode] = useState<'home' | 'host' | 'join' | 'active'>('home');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [listeners, setListeners] = useState(1);
  const [sessionState, setSessionState] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<any>(null);
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
  const deviceId = getDeviceId();
  const displayName = localStorage.getItem('aura_profile_name') || 'Listener';

  useEffect(() => {
    if (!isHost || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!currentTrack) return;
    wsRef.current.send(JSON.stringify({
      type: 'state_update',
      state: { video_id: currentTrack.id, title: currentTrack.title, artist: currentTrack.artist, cover: currentTrack.coverArt, is_playing: isPlaying },
    }));
  }, [currentTrack, isPlaying, isHost]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWS = (code: string, host: boolean) => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/session/${code}?device_id=${deviceId}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state') {
        setListeners(msg.listeners);
        setSessionState(msg.state);
        setIsHost(msg.is_host);
        if (!host && msg.state?.video_id && msg.state.video_id !== currentTrack?.id) {
          playTrack({ id: msg.state.video_id, title: msg.state.title, artist: msg.state.artist, coverArt: msg.state.cover, url: '' });
        }
      } else if (msg.type === 'chat') {
        setMessages(prev => [...prev, msg]);
      }
    };
    ws.onerror = () => setError('Connection failed. Make sure the backend is running.');
    ws.onclose = () => { if (mode === 'active') setError('Disconnected from session.'); };
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/sessions/create`, { method: 'POST', headers: { 'X-Device-ID': deviceId } });
      const data = await res.json();
      if (data.room_code) {
        setRoomCode(data.room_code);
        setIsHost(true);
        connectWS(data.room_code, true);
        setMode('active');
      } else setError('Failed to create room');
    } catch { setError('Failed to create room. Is the backend running?'); }
    finally { setLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) { setError('Enter a room code'); return; }
    setLoading(true);
    setError('');
    try {
      const code = joinCode.trim().toUpperCase();
      setRoomCode(code);
      connectWS(code, false);
      setMode('active');
    } catch { setError('Failed to join room'); }
    finally { setLoading(false); }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const sendChat = () => {
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'chat', message: chatInput.trim(), sender: displayName }));
    setMessages(prev => [...prev, { type: 'chat', message: chatInput.trim(), sender: displayName, is_self: true }]);
    setChatInput('');
  };

  const handleLeave = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setMode('home');
    setRoomCode('');
    setJoinCode('');
    setMessages([]);
    setSessionState(null);
    setError('');
  };

  const s = { width: '100%', padding: '12px 16px', borderRadius: 12, border: 'var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as any };

  return (
    <motion.div style={{ padding: '24px', maxWidth: 560, margin: '0 auto', height: '100%', overflowY: 'auto' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(236,72,153,0.3)' }}>
          <Users size={24} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>Listen Together</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sync music playback with friends in real-time</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#ef4444', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* HOME — choose host or join */}
        {mode === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div
              className="glass-panel"
              whileHover={{ scale: 1.01 }}
              style={{ borderRadius: 20, padding: '28px 24px', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' }}
              onClick={() => setMode('host')}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎙️</div>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px' }}>Start a Session</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Host a listening party and invite friends with a room code.</p>
            </motion.div>
            <motion.div
              className="glass-panel"
              whileHover={{ scale: 1.01 }}
              style={{ borderRadius: 20, padding: '28px 24px', cursor: 'pointer' }}
              onClick={() => setMode('join')}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎧</div>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px' }}>Join a Session</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Enter a room code to sync with a friend's music.</p>
            </motion.div>
          </motion.div>
        )}

        {/* HOST — create room */}
        {mode === 'host' && (
          <motion.div key="host" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-panel" style={{ borderRadius: 20, padding: '28px 24px' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>🎙️ Host a Session</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 24 }}>Create a room and share the code with your friends.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="secondary-btn" onClick={() => setMode('home')}>← Back</button>
              <button className="primary-btn" onClick={handleCreateRoom} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Creating...' : '🚀 Create Room'}
              </button>
            </div>
          </motion.div>
        )}

        {/* JOIN — enter code */}
        {mode === 'join' && (
          <motion.div key="join" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-panel" style={{ borderRadius: 20, padding: '28px 24px' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>🎧 Join a Session</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>Enter the room code shared by your friend.</p>
            <input
              style={{ ...s, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '1.2rem', textAlign: 'center', marginBottom: 16 }}
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
              maxLength={8}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="secondary-btn" onClick={() => setMode('home')}>← Back</button>
              <button className="primary-btn" onClick={handleJoinRoom} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Joining...' : '🎵 Join Room'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ACTIVE SESSION */}
        {mode === 'active' && (
          <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Room Card */}
            <div className="glass-panel" style={{ borderRadius: 20, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {isHost ? '🎙️ Hosting' : '🎧 Listening'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-primary)' }}>{roomCode}</span>
                    <button onClick={handleCopyCode} style={{ padding: 6, borderRadius: 8, background: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-surface)', border: 'var(--glass-border)', color: copied ? '#10b981' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Users size={14} /> {listeners} listening
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Live</span>
                  </div>
                </div>
              </div>

              {/* Now Playing */}
              {(currentTrack || sessionState) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 14, background: 'var(--bg-surface)' }}>
                  <img src={currentTrack?.coverArt || sessionState?.cover} alt="cover" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                      {currentTrack?.title || sessionState?.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {currentTrack?.artist || sessionState?.artist}
                    </div>
                  </div>
                  {isHost && (
                    <button onClick={togglePlayPause} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-gradient)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="glass-panel" style={{ borderRadius: 20, padding: '16px', display: 'flex', flexDirection: 'column', height: 280 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageCircle size={13} /> Chat
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center', marginTop: 20 }}>No messages yet. Say hi! 👋</p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.is_self ? 'flex-end' : 'flex-start' }}>
                    {!msg.is_self && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 2, paddingLeft: 4 }}>{msg.sender}</span>}
                    <div style={{
                      maxWidth: '75%', padding: '8px 13px', borderRadius: 14,
                      background: msg.is_self ? 'var(--accent-gradient)' : 'var(--bg-surface)',
                      color: msg.is_self ? 'white' : 'var(--text-primary)',
                      fontSize: '0.85rem', borderBottomRightRadius: msg.is_self ? 4 : 14, borderBottomLeftRadius: msg.is_self ? 14 : 4,
                    }}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  style={{ flex: 1, ...s, padding: '9px 13px' }}
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                />
                <button onClick={sendChat} style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-gradient)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <Send size={15} />
                </button>
              </div>
            </div>

            <button
              onClick={handleLeave}
              style={{ width: '100%', padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
            >
              Leave Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
