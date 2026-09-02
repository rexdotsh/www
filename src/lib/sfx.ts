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

const MASTER_GAIN = 0.8;
const STORAGE_KEY = "sound";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
const listeners = new Set<(muted: boolean) => void>();

// browsers without the api (older safari) get the benefit of the doubt
const activation = () => {
  const state = navigator.userActivation;
  return state
    ? { ever: state.hasBeenActive, now: state.isActive }
    : { ever: true, now: true };
};

// no context before the page has been touched: it would only sit suspended
// and complain in the console
const ensure = () => {
  if (typeof window === "undefined" || !activation().ever) {
    return null;
  }
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(context.destination);
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

// peaks sit around -16 to -10 dBFS after the master: present, not loud.
// fundamentals stay above ~250hz so laptop speakers can actually make them
const SOUNDS: Record<Sound, (ctx: AudioContext) => void> = {
  // a card landing, a toc step
  tick: (ctx) => tone(ctx, "sine", 1500, 950, 0.2, 0.003, 0.07),
  // something confirmed
  pop: (ctx) => tone(ctx, "sine", 520, 820, 0.32, 0.008, 0.1),
  // a switch, falling and rising
  lightsOff: (ctx) => {
    tone(ctx, "triangle", 320, 160, 0.4, 0.005, 0.13);
    hiss(ctx, 3000, 400, 0.14, 0.003, 0.05);
  },
  lightsOn: (ctx) => {
    tone(ctx, "triangle", 170, 340, 0.4, 0.005, 0.13);
    hiss(ctx, 400, 3000, 0.14, 0.003, 0.05);
  },
  // the rose scattering
  puff: (ctx) => hiss(ctx, 1600, 220, 0.7, 0.01, 0.24),
  // two steps up, two steps down
  play: (ctx) => {
    tone(ctx, "sine", 620, 640, 0.25, 0.006, 0.07);
    tone(ctx, "sine", 930, 960, 0.25, 0.006, 0.1, ctx.currentTime + 0.07);
  },
  pause: (ctx) => {
    tone(ctx, "sine", 930, 900, 0.25, 0.006, 0.07);
    tone(ctx, "sine", 620, 600, 0.25, 0.006, 0.1, ctx.currentTime + 0.07);
  },
  // a petal touching down
  chime: (ctx) => {
    tone(ctx, "sine", 1320, 1318, 0.2, 0.01, 0.9);
    tone(ctx, "sine", 1980, 1976, 0.08, 0.01, 0.6);
  },
};

// resume() settles asynchronously, so the sound that rides the unlocking
// gesture waits for it instead of being dropped. without a live gesture a
// suspended context cannot be lifted, and the sound is let go
export const sfx = (sound: Sound) => {
  if (muted) {
    return;
  }
  const ctx = ensure();
  if (!ctx) {
    return;
  }
  if (ctx.state === "running") {
    SOUNDS[sound](ctx);
  } else if (activation().now) {
    ctx
      .resume()
      .then(() => SOUNDS[sound](ctx))
      .catch(() => undefined);
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
// hover sounds later on are allowed to play. pointerup rather than pointerdown:
// a touch only counts as a gesture once the finger lifts
if (typeof window !== "undefined") {
  try {
    muted = localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    // private mode
  }
  const wake = () => {
    const ctx = ensure();
    if (!ctx) {
      return;
    }
    ctx
      .resume()
      .then(() => {
        if (ctx.state === "running") {
          window.removeEventListener("pointerup", wake);
          window.removeEventListener("keydown", wake);
        }
      })
      .catch(() => undefined);
  };
  window.addEventListener("pointerup", wake, { passive: true });
  window.addEventListener("keydown", wake);
}
