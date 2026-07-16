// @ts-nocheck
import { useEffect, useRef, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayer } from '../context/PlayerContext';
import './WaveformDisplay.css';

interface WaveformDisplayProps {
  localUrl?: string;  // Only for local files
  isPlaying?: boolean;
}

// Deterministic bar heights based on track id
function seededHeights(seed: string, count: number): number[] {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    heights.push(20 + Math.floor((s / 233280) * 60));
  }
  return heights;
}

export default function WaveformDisplay({ localUrl, isPlaying }: WaveformDisplayProps) {
  const { currentTrack } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);

  const BAR_COUNT = 50;
  const barHeights = useMemo(
    () => seededHeights(currentTrack?.id || 'default', BAR_COUNT),
    [currentTrack?.id]
  );

  // WaveSurfer for local files only
  useEffect(() => {
    if (!localUrl || !containerRef.current) return;

    // Destroy existing
    if (wavesurferRef.current) {
      try { wavesurferRef.current.destroy(); } catch {}
    }

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(139, 92, 246, 0.5)',
      progressColor: 'rgb(139, 92, 246)',
      cursorColor: 'rgba(255,255,255,0.5)',
      barWidth: 2,
      barRadius: 2,
      barGap: 2,
      height: 80,
      normalize: true,
      interact: false,
    });

    wavesurferRef.current.load(localUrl);

    return () => {
      if (wavesurferRef.current) {
        try { wavesurferRef.current.destroy(); } catch {}
        wavesurferRef.current = null;
      }
    };
  }, [localUrl]);

  // For YouTube/non-local: show animated CSS bars
  if (!localUrl) {
    return (
      <div className="waveform-display-container">
        <div className="waveform-css-bars">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`waveform-css-bar ${isPlaying ? 'animating' : ''}`}
              style={{
                height: `${h}%`,
                animationDelay: `${(i % 7) * 0.09}s`,
                animationDuration: `${0.5 + (i % 5) * 0.1}s`,
              }}
            />
          ))}
        </div>
        <div className="waveform-label">Audio Waveform</div>
      </div>
    );
  }

  return (
    <div className="waveform-display-container">
      <div className="waveform-canvas-wrap" ref={containerRef} />
      <div className="waveform-label">Waveform</div>
    </div>
  );
}
