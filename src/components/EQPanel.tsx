// @ts-nocheck
import './EQPanel.css';
import { usePlayer } from '../context/PlayerContext';

export default function EQPanel({ onClose }: { onClose: () => void }) {
  const { 
    bass, mid, treble, pan, setBass, setMid, setTreble, setPan,
    pitch, setPitch, replayGain, setReplayGain,
    crossfadeDuration, setCrossfadeDuration,
  } = usePlayer();

  return (
    <div className="eq-panel glass-panel">
      <div className="eq-header">
        <h3>Audio Settings</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="eq-sliders">
        {/* EQ Section */}
        <div className="eq-section-label">🎛️ Equalizer</div>

        <div className="slider-group">
          <label>Bass</label>
          <input type="range" min="-15" max="15" value={bass}
            onChange={(e) => setBass(Number(e.target.value))} />
          <span>{bass} dB</span>
        </div>

        <div className="slider-group">
          <label>Mid</label>
          <input type="range" min="-15" max="15" value={mid}
            onChange={(e) => setMid(Number(e.target.value))} />
          <span>{mid} dB</span>
        </div>

        <div className="slider-group">
          <label>Treble</label>
          <input type="range" min="-15" max="15" value={treble}
            onChange={(e) => setTreble(Number(e.target.value))} />
          <span>{treble} dB</span>
        </div>

        <div className="slider-group">
          <label>Stereo Pan</label>
          <input type="range" min="-1" max="1" step="0.1" value={pan}
            onChange={(e) => setPan(Number(e.target.value))} />
          <span>{pan > 0 ? 'Right' : pan < 0 ? 'Left' : 'Center'}</span>
        </div>

        {/* Pitch Section */}
        <div className="eq-section-label" style={{ marginTop: '12px' }}>🎼 Pitch Control</div>
        <div className="slider-group">
          <label>Pitch</label>
          <input type="range" min="-12" max="12" step="1" value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))} />
          <span>{pitch > 0 ? `+${pitch}` : pitch} st</span>
        </div>
        <div className="eq-hint">Semitones — works for local files. YouTube audio unaffected.</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
          <button className="eq-reset-btn" onClick={() => setPitch(0)}>Reset Pitch</button>
        </div>

        {/* Crossfade Section */}
        <div className="eq-section-label" style={{ marginTop: '12px' }}>🎚️ Crossfade</div>
        <div className="slider-group">
          <label>Duration</label>
          <input type="range" min="0" max="10" step="1" value={crossfadeDuration}
            onChange={(e) => setCrossfadeDuration(Number(e.target.value))} />
          <span>{crossfadeDuration === 0 ? 'Off' : `${crossfadeDuration}s`}</span>
        </div>

        {/* ReplayGain */}
        <div className="eq-section-label" style={{ marginTop: '12px' }}>🔊 Volume</div>
        <div className="eq-toggle-row">
          <label htmlFor="replaygain-toggle">ReplayGain (Normalize)</label>
          <label className="eq-toggle-switch">
            <input
              id="replaygain-toggle"
              type="checkbox"
              checked={replayGain}
              onChange={(e) => setReplayGain(e.target.checked)}
            />
            <span className="eq-toggle-slider" />
          </label>
        </div>
        <div className="eq-hint">Auto-normalize volume across all tracks (local files only).</div>
      </div>
    </div>
  );
}
