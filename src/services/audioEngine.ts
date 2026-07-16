// @ts-nocheck
/**
 * Audio Engine — Web Audio API wrapper
 * Handles: Pitch Control, ReplayGain (volume normalization), audio routing
 */

let audioCtx: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let gainNode: GainNode | null = null;
let compressorNode: DynamicsCompressorNode | null = null;

// For pitch shifting we use a ScriptProcessorNode with phase vocoder concept.
// Since true pitch shifting in browser needs AudioWorklet (complex), 
// we use playbackRate trick + compensation via detune for local audio elements.
// For YouTube (iframe), we use a proxy approach.

let pitchValue = 0; // semitones, -12 to +12
let replayGainEnabled = false;

export function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Connect a local HTMLAudioElement to the Web Audio graph
 */
export function connectLocalAudio(audioEl: HTMLAudioElement): void {
  const ctx = getAudioContext();
  
  // Avoid double connection
  if (sourceNode) {
    try { sourceNode.disconnect(); } catch {}
  }
  
  sourceNode = ctx.createMediaElementSource(audioEl);
  gainNode = ctx.createGain();
  compressorNode = ctx.createDynamicsCompressor();
  
  // Compressor settings for ReplayGain-like normalization
  compressorNode.threshold.setValueAtTime(-24, ctx.currentTime);
  compressorNode.knee.setValueAtTime(30, ctx.currentTime);
  compressorNode.ratio.setValueAtTime(12, ctx.currentTime);
  compressorNode.attack.setValueAtTime(0.003, ctx.currentTime);
  compressorNode.release.setValueAtTime(0.25, ctx.currentTime);
  
  if (replayGainEnabled) {
    sourceNode.connect(gainNode);
    gainNode.connect(compressorNode);
    compressorNode.connect(ctx.destination);
  } else {
    sourceNode.connect(gainNode);
    gainNode.connect(ctx.destination);
  }
}

/**
 * Set pitch in semitones for local audio via playbackRate + detune trick.
 * -12 to +12 semitones.
 */
export function setPitch(semitones: number, audioEl?: HTMLAudioElement): void {
  pitchValue = semitones;
  if (!audioEl) return;
  
  // Convert semitones to playback rate ratio
  // We keep the rate at 1.0 and adjust detune (in cents)
  const cents = semitones * 100;
  // HTMLAudioElement doesn't support detune directly, 
  // but AudioBufferSourceNode does. For MediaElementSource we use playbackRate.
  // Pitch shift = 2^(semitones/12)
  const rate = Math.pow(2, semitones / 12);
  audioEl.preservesPitch = true; // modern browsers
  (audioEl as any).mozPreservesPitch = true;
  (audioEl as any).webkitPreservesPitch = true;
  audioEl.playbackRate = rate;
}

/**
 * Get current pitch value
 */
export function getPitch(): number {
  return pitchValue;
}

/**
 * Toggle ReplayGain (dynamics compressor for volume normalization)
 */
export function setReplayGain(enabled: boolean): void {
  replayGainEnabled = enabled;
  if (!gainNode || !compressorNode || !sourceNode || !audioCtx) return;
  
  try {
    sourceNode.disconnect();
    gainNode.disconnect();
    compressorNode.disconnect();
    
    sourceNode.connect(gainNode);
    if (enabled) {
      gainNode.connect(compressorNode);
      compressorNode.connect(audioCtx.destination);
    } else {
      gainNode.connect(audioCtx.destination);
    }
  } catch (e) {
    console.warn('ReplayGain routing error:', e);
  }
}

/**
 * Set master gain (0.0 to 1.0)
 */
export function setGain(value: number): void {
  if (gainNode && audioCtx) {
    gainNode.gain.setValueAtTime(value, audioCtx.currentTime);
  }
}

/**
 * Resume AudioContext (needed after user gesture)
 */
export function resumeAudioContext(): void {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * Disconnect and clean up
 */
export function disconnectAudio(): void {
  try {
    sourceNode?.disconnect();
    gainNode?.disconnect();
    compressorNode?.disconnect();
  } catch {}
  sourceNode = null;
  gainNode = null;
  compressorNode = null;
}

/**
 * Get frequency data for visualizer (if connected)
 */
let analyserNode: AnalyserNode | null = null;

export function createAnalyser(): AnalyserNode | null {
  if (!audioCtx || !gainNode) return null;
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;
  gainNode.connect(analyserNode);
  return analyserNode;
}

export function getFrequencyData(): Uint8Array | null {
  if (!analyserNode) return null;
  const data = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(data);
  return data;
}
