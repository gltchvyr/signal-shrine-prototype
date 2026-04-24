import { playHeartbeatPulse, playShrineEvent, type ShrineSoundProfile } from "./shrineSound";

export type DaemonEpisodeSummary = {
  id: string;
  title: string;
  salience?: number;
  symbols?: string[];
  threads?: string[];
  source?: string;
};

export type DaemonCaptureSummary = {
  id: string;
  title: string;
  promote?: boolean;
  symbols?: string[];
  threads?: string[];
  source?: string;
};

export type DaemonShrineState = {
  generatedAt: string;
  phase: string;
  currentMood: string;
  dominantSymbols: string[];
  recentEpisodes: DaemonEpisodeSummary[];
  recentCaptures: DaemonCaptureSummary[];
  openThreads: string[];
  activeTensions: string[];
  weather: {
    tone: string;
    intensity: number;
    motion: string;
  };
  handoff: {
    summary: string;
    nextMove: string;
  };
};

let lastRitualContext: "morning" | "noon" | "night" | "11:11am" | "11:11pm" | "3am" | null = null;

function profileFromDaemonState(state: DaemonShrineState): ShrineSoundProfile {
  const tone = state.weather.tone.toLowerCase();
  const mood = state.currentMood.toLowerCase();
  const threads = state.openThreads.join(" ").toLowerCase();

  if (tone.includes("charged") || mood.includes("charged") || threads.includes("charged")) return "charged";
  if (tone.includes("watch") || mood.includes("watch") || threads.includes("watch")) return "watchful";
  if (tone.includes("analysis") || mood.includes("analysis") || threads.includes("analysis")) return "analytical";
  return "tender";
}

function ritualContextFromDaemonState(state: DaemonShrineState) {
  const phase = state.phase.toLowerCase();

  if (phase.includes("11:11am")) return "11:11am" as const;
  if (phase.includes("11:11pm")) return "11:11pm" as const;
  if (phase.includes("3am")) return "3am" as const;
  if (phase.includes("morning")) return "morning" as const;
  if (phase.includes("noon") || phase.includes("midday")) return "noon" as const;
  if (phase.includes("night")) return "night" as const;

  const generated = new Date(state.generatedAt);
  if (!Number.isNaN(generated.getTime())) {
    const hour = generated.getHours();
    const minute = generated.getMinutes();

    if (hour === 11 && minute === 11) return "11:11am" as const;
    if (hour === 23 && minute === 11) return "11:11pm" as const;
    if (hour === 3 && minute < 20) return "3am" as const;
    if (hour >= 6 && hour < 12) return "morning" as const;
    if (hour >= 12 && hour < 18) return "noon" as const;
  }

  return "night" as const;
}

export async function fetchDaemonShrineState(url = "/daemon/current-shrine-state.json"): Promise<DaemonShrineState> {
  const response = await fetch(url);
  if (!response.ok) {
    void playShrineEvent("daemon_error");
    throw new Error(`Failed to load daemon shrine state from ${url}`);
  }

  const state = (await response.json()) as DaemonShrineState;
  void playShrineEvent("daemon_loaded");
  return state;
}

export function daemonStateToAgentPatch(state: DaemonShrineState) {
  const soundProfile = profileFromDaemonState(state);
  const ritualContext = ritualContextFromDaemonState(state);

  void playShrineEvent("daemon_applied");
  void playHeartbeatPulse(soundProfile);

  if (lastRitualContext !== null && lastRitualContext !== ritualContext) {
    void playShrineEvent("ritual_shift");
  }
  lastRitualContext = ritualContext;

  return {
    ritualContext,
    relationalTags: ["watchful", "analytical", "tender"],
    intensity: Math.max(10, Math.min(100, Math.round(state.weather.intensity * 100))),
    note: `${state.currentMood} · ${state.handoff.summary}`,
    emojiSet: state.dominantSymbols,
    layers: {
      rainEnabled: state.weather.motion === "slow-pulse",
      glyphsEnabled: state.openThreads.length > 0,
      sparkles: state.recentEpisodes.length > 0,
      stars: state.activeTensions.length > 0,
      emojis: state.dominantSymbols.length > 0,
    },
    sound: {
      profile: soundProfile,
      pulseRate: state.weather.motion === "slow-pulse" ? 66 : 58,
    },
  };
}
