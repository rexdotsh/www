// tiny synthesised sounds for the micro-interactions. nothing is fetched; the
// audio context is created on the first gesture, which is also when browsers
// first allow it to make a sound

export type Sound =
  | "tick"
  | "pop"
  | "lightsOff"
  | "lightsOn"
  | "puff"
  | "play"
  | "pause"
  | "chime";

const MASTER_GAIN = 0.32;
const STORAGE_KEY = "sound";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
const listeners = new Set<(muted: boolean) => void>();

const ensure = () => {
  if (typeof window === "undefined") {
    return null;
  }
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(context.destination);
  }
  if (context.state === "suspended") {
    context.resume().catch(() => undefined);
  }
  return context;
};

// a percussive envelope: quick attack, exponential fall
const envelope = (
  ctx: AudioContext,
  peak: number,
  attack: number,
  decay: number,
  at: number
) => {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  gain.connect(master as GainNode);
  return gain;
};

const tone = (
  ctx: AudioContext,
  type: OscillatorType,
  from: number,
  to: number,
  peak: number,
  attack: number,
  decay: number,
  at = ctx.currentTime
) => {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + attack + decay);
  osc.connect(envelope(ctx, peak, attack, decay, at));
  osc.start(at);
  osc.stop(at + attack + decay + 0.02);
};

const hiss = (
  ctx: AudioContext,
  cutoffFrom: number,
  cutoffTo: number,
  peak: number,
  attack: number,
  decay: number
) => {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  const at = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoffFrom, at);
  filter.frequency.exponentialRampToValueAtTime(cutoffTo, at + attack + decay);
  source.connect(filter);
  filter.connect(envelope(ctx, peak, attack, decay, at));
  source.start(at);
  source.stop(at + attack + decay + 0.02);
};

const SOUNDS: Record<Sound, (ctx: AudioContext) => void> = {
  // a card landing, a toc step
  tick: (ctx) => tone(ctx, "sine", 1500, 950, 0.07, 0.004, 0.045),
  // something confirmed
  pop: (ctx) => tone(ctx, "sine", 520, 820, 0.14, 0.008, 0.09),
  // a switch, falling and rising
  lightsOff: (ctx) => {
    tone(ctx, "triangle", 190, 95, 0.2, 0.006, 0.12);
    hiss(ctx, 3000, 400, 0.05, 0.003, 0.05);
  },
  lightsOn: (ctx) => {
    tone(ctx, "triangle", 110, 230, 0.2, 0.006, 0.12);
    hiss(ctx, 400, 3000, 0.05, 0.003, 0.05);
  },
  // the rose scattering
  puff: (ctx) => hiss(ctx, 1600, 220, 0.22, 0.01, 0.22),
  // two steps up, two steps down
  play: (ctx) => {
    tone(ctx, "sine", 620, 640, 0.1, 0.006, 0.06);
    tone(ctx, "sine", 930, 960, 0.1, 0.006, 0.08, ctx.currentTime + 0.07);
  },
  pause: (ctx) => {
    tone(ctx, "sine", 930, 900, 0.1, 0.006, 0.06);
    tone(ctx, "sine", 620, 600, 0.1, 0.006, 0.08, ctx.currentTime + 0.07);
  },
  // a petal touching down
  chime: (ctx) => {
    tone(ctx, "sine", 1320, 1318, 0.07, 0.01, 0.6);
    tone(ctx, "sine", 1980, 1976, 0.03, 0.01, 0.45);
  },
};

export const sfx = (sound: Sound) => {
  if (muted) {
    return;
  }
  const ctx = ensure();
  if (ctx && ctx.state === "running") {
    SOUNDS[sound](ctx);
  }
};

export const isMuted = () => muted;

export const setMuted = (next: boolean) => {
  muted = next;
  try {
    if (next) {
      localStorage.setItem(STORAGE_KEY, "off");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // private mode; the choice just won't persist
  }
  for (const listener of listeners) {
    listener(next);
  }
};

export const onMuteChange = (listener: (muted: boolean) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// read the stored choice and wake the context on the first real gesture, so
// hover sounds later on are allowed to play
if (typeof window !== "undefined") {
  try {
    muted = localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    // private mode
  }
  const wake = () => {
    ensure();
    window.removeEventListener("pointerdown", wake);
    window.removeEventListener("keydown", wake);
  };
  window.addEventListener("pointerdown", wake, { passive: true });
  window.addEventListener("keydown", wake);
}
