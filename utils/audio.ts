// Simple synth for UI sounds to avoid external assets
const getAudioContext = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return null;
  return new AudioContext();
};

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = getAudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) => {
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
};

export const playCorrectSound = () => {
  // Ding! (High chime, pleasant)
  playTone(523.25, 'sine', 0.1, 0, 0.1); // C5
  playTone(1046.50, 'sine', 0.3, 0.08, 0.1); // C6
};

export const playWrongSound = () => {
  // Thud (Softer sawtooth)
  playTone(130, 'triangle', 0.1, 0, 0.15);
  playTone(100, 'triangle', 0.3, 0.05, 0.15);
};

export const playFinishSound = () => {
  // Fanfare
  const now = 0;
  const speed = 0.08;
  playTone(523.25, 'triangle', 0.2, now, 0.1); // C
  playTone(659.25, 'triangle', 0.2, now + speed, 0.1); // E
  playTone(783.99, 'triangle', 0.2, now + speed * 2, 0.1); // G
  playTone(1046.50, 'triangle', 0.6, now + speed * 3, 0.1); // C high
};

export const playClickSound = () => {
  // Very subtle click
  playTone(800, 'sine', 0.03, 0, 0.02);
};

export const playPopSound = () => {
  // Bubble pop
  const ctx = initAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

export const playLevelUpSound = () => {
  const now = 0;
  playTone(440, 'sine', 0.1, now, 0.1);
  playTone(554, 'sine', 0.1, now + 0.1, 0.1);
  playTone(659, 'sine', 0.1, now + 0.2, 0.1);
  playTone(880, 'sine', 0.4, now + 0.3, 0.1);
};