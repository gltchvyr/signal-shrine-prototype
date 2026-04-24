export type ShrineSoundEvent =
  | "daemon_loaded"
  | "daemon_applied"
  | "ritual_shift"
  | "daemon_error";

export type ShrineSoundProfile = "tender" | "watchful" | "charged" | "analytical";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  return audioContext;
}

async function ensureRunningContext() {
  const context = getAudioContext();
  if (!context) return null;

  if (context.state === "suspended") {
    await context.resume();
  }

  return context;
}

function envelope(gainNode: GainNode, context: AudioContext, attack: number, sustain: number, release: number, peak = 0.08) {
  const now = context.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(peak, now + attack);
  gainNode.gain.setValueAtTime(peak, now + attack + sustain);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attack + sustain + release);
}

async function playTone({
  frequency,
  type,
  attack = 0.01,
  sustain = 0.06,
  release = 0.18,
  gain = 0.06,
}: {
  frequency: number;
  type: OscillatorType;
  attack?: number;
  sustain?: number;
  release?: number;
  gain?: number;
}) {
  const context = await ensureRunningContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, context.currentTime);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(context.destination);

  envelope(gainNode, context, attack, sustain, release, gain);

  oscillator.start();
  oscillator.stop(context.currentTime + attack + sustain + release + 0.02);
}

export async function playShrineEvent(event: ShrineSoundEvent) {
  switch (event) {
    case "daemon_loaded":
      await playTone({ frequency: 392, type: "sine", gain: 0.045, sustain: 0.05, release: 0.16 });
      await playTone({ frequency: 523.25, type: "triangle", gain: 0.035, sustain: 0.04, release: 0.14 });
      return;
    case "daemon_applied":
      await playTone({ frequency: 261.63, type: "triangle", gain: 0.05, sustain: 0.08, release: 0.22 });
      await playTone({ frequency: 392, type: "sine", gain: 0.04, sustain: 0.06, release: 0.18 });
      return;
    case "ritual_shift":
      await playTone({ frequency: 440, type: "sine", gain: 0.04, sustain: 0.03, release: 0.12 });
      return;
    case "daemon_error":
      await playTone({ frequency: 160, type: "sawtooth", gain: 0.03, sustain: 0.08, release: 0.24 });
      return;
  }
}

export async function playHeartbeatPulse(profile: ShrineSoundProfile = "tender") {
  const profileMap: Record<ShrineSoundProfile, { base: number; accent: number; type: OscillatorType; gain: number }> = {
    tender: { base: 84, accent: 126, type: "sine", gain: 0.05 },
    watchful: { base: 96, accent: 144, type: "triangle", gain: 0.045 },
    charged: { base: 110, accent: 164.81, type: "sawtooth", gain: 0.04 },
    analytical: { base: 90, accent: 180, type: "square", gain: 0.03 },
  };

  const selected = profileMap[profile];

  await playTone({ frequency: selected.base, type: selected.type, gain: selected.gain, attack: 0.005, sustain: 0.04, release: 0.16 });

  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      void playTone({
        frequency: selected.accent,
        type: selected.type,
        gain: Math.max(0.02, selected.gain - 0.01),
        attack: 0.004,
        sustain: 0.03,
        release: 0.12,
      });
    }, 110);
  }
}
