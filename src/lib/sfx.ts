export type Sound =
  | "tick"
  | "pop"
  | "lightsOff"
  | "lightsOn"
  | "puff"
  | "play"
  | "pause"
  | "chime"
  | "stir";

const MASTER_GAIN = 0.8;
const STORAGE_KEY = "sound";
const NOISE_SECONDS = 0.4;

interface AudioState {
  context: AudioContext;
  noise: AudioBuffer | null;
  output: GainNode;
}

let audio: AudioState | null = null;
let muted = false;
const listeners = new Set<(muted: boolean) => void>();

const hasActivation = () =>
  !navigator.userActivation || navigator.userActivation.hasBeenActive;

const getAudio = () => {
  if (
    typeof window === "undefined" ||
    typeof AudioContext === "undefined" ||
    !hasActivation()
  ) {
    return null;
  }
  if (audio) {
    return audio;
  }

  const context = new AudioContext();
  const output = context.createGain();
  output.gain.value = MASTER_GAIN;
  output.connect(context.destination);
  audio = { context, noise: null, output };
  return audio;
};

const envelope = (
  state: AudioState,
  peak: number,
  attack: number,
  decay: number,
  at: number
) => {
  const gain = state.context.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  gain.connect(state.output);
  return gain;
};

const tone = (
  state: AudioState,
  type: OscillatorType,
  from: number,
  to: number,
  peak: number,
  attack: number,
  decay: number,
  at = state.context.currentTime
) => {
  const oscillator = state.context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, at);
  oscillator.frequency.exponentialRampToValueAtTime(to, at + attack + decay);
  oscillator.connect(envelope(state, peak, attack, decay, at));
  oscillator.start(at);
  oscillator.stop(at + attack + decay + 0.02);
};

const hiss = (
  state: AudioState,
  cutoffFrom: number,
  cutoffTo: number,
  peak: number,
  attack: number,
  decay: number
) => {
  if (!state.noise) {
    const { context } = state;
    state.noise = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * NOISE_SECONDS),
      context.sampleRate
    );
    const data = state.noise.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
  }

  const at = state.context.currentTime;
  const source = state.context.createBufferSource();
  source.buffer = state.noise;
  const filter = state.context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoffFrom, at);
  filter.frequency.exponentialRampToValueAtTime(cutoffTo, at + attack + decay);
  source.connect(filter);
  filter.connect(envelope(state, peak, attack, decay, at));
  source.start(at);
  source.stop(at + attack + decay + 0.02);
};

type SoundPlayer = (state: AudioState, pitch?: number) => void;

const playSound: Record<Sound, SoundPlayer> = {
  // a card landing, a toc step, and the sound that confirms a hover
  tick: (state, pitch = 950) =>
    tone(state, "triangle", pitch * 1.45, pitch, 0.34, 0.006, 0.12),
  pop: (state) => tone(state, "sine", 520, 820, 0.32, 0.008, 0.1),
  lightsOff: (state) => {
    tone(state, "triangle", 320, 160, 0.4, 0.005, 0.13);
    hiss(state, 3000, 400, 0.14, 0.003, 0.05);
  },
  lightsOn: (state) => {
    tone(state, "triangle", 170, 340, 0.4, 0.005, 0.13);
    hiss(state, 400, 3000, 0.14, 0.003, 0.05);
  },
  puff: (state) => hiss(state, 1600, 220, 0.7, 0.01, 0.24),
  play: (state) => {
    tone(state, "sine", 620, 640, 0.25, 0.006, 0.07);
    tone(
      state,
      "sine",
      930,
      960,
      0.25,
      0.006,
      0.1,
      state.context.currentTime + 0.07
    );
  },
  pause: (state) => {
    tone(state, "sine", 930, 900, 0.25, 0.006, 0.07);
    tone(
      state,
      "sine",
      620,
      600,
      0.25,
      0.006,
      0.1,
      state.context.currentTime + 0.07
    );
  },
  chime: (state) => {
    tone(state, "sine", 1320, 1318, 0.2, 0.01, 0.9);
    tone(state, "sine", 1980, 1976, 0.08, 0.01, 0.6);
  },
  // the rose waking from a doze
  stir: (state) => tone(state, "sine", 260, 340, 0.16, 0.03, 0.22),
};

function stopUnlock() {
  window.removeEventListener("pointerup", unlock);
  window.removeEventListener("keydown", unlock);
}

function unlock() {
  if (muted) {
    return;
  }
  const state = getAudio();
  if (!state) {
    return;
  }
  if (state.context.state === "running") {
    stopUnlock();
    return;
  }
  state.context
    .resume()
    .then(() => {
      if (state.context.state === "running") {
        stopUnlock();
      }
    })
    .catch(() => undefined);
}

export const sfx = (sound: Sound, pitch = 950) => {
  if (muted) {
    return;
  }
  const state = getAudio();
  if (!state) {
    return;
  }
  if (state.context.state === "running") {
    playSound[sound](state, pitch);
    return;
  }

  state.context
    .resume()
    .then(() => {
      if (!muted && state.context.state === "running") {
        playSound[sound](state, pitch);
      }
    })
    .catch(() => undefined);
};

// c pentatonic, one note per word of the sentence, so reading it left to
// right hums a scale
export const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

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

if (typeof window !== "undefined") {
  try {
    muted = localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    // private mode
  }
  window.addEventListener("pointerup", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}
