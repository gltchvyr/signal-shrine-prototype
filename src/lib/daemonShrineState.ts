import { playHeartbeatPulse, playShrineEvent, type ShrineSoundProfile } from "./shrineSound";

export type DaemonEpisodeSummary = {
  date?: string;
  id?: string;
  title: string;
  symbols?: string[];
};

export type DaemonProjectSummary = {
  id?: string;
  name?: string;
  status?: string;
  focus?: string | null;
};

export type DaemonShrineState = {
  schema: "gltch.shrine-projection";
  schemaVersion: "1.0.0";
  generatedAt: string;
  applyAllowed: boolean;
  validation: {
    status: "current" | "refused" | "unbound";
    integrity: "valid" | "invalid" | "not_checked";
    currency: "matched" | "mismatch" | "not_checked";
    errors: string[];
  };
  source: {
    authority: string;
    revision: number | null;
    payloadSha256: string | null;
    continuityCanaryPresent: boolean;
  };
  phase: string;
  currentMood: string;
  dominantSymbols: string[];
  recentEpisodes: DaemonEpisodeSummary[];
  recentCaptures: unknown[];
  openThreads: string[];
  activeTensions: string[];
  projects: DaemonProjectSummary[];
  signalFootprint: {
    date?: string | null;
    status?: string | null;
    activeThread?: string | null;
    nextMove?: string | null;
  } | null;
  weather: { tone: string; intensity: number; motion: string };
  heartbeat: { lastPulseAt: string | null; pulseCount: number; status: string };
  handoff: { summary: string; nextMove: string };
};

let lastRitualContext: "morning" | "noon" | "night" | "11:11am" | "11:11pm" | "3am" | null = null;

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertDaemonShrineState(value: unknown): asserts value is DaemonShrineState {
  if (!object(value) || value.schema !== "gltch.shrine-projection" || value.schemaVersion !== "1.0.0") {
    throw new Error("Daemon state is not a supported Shrine Projection v1 object.");
  }
  if (!object(value.validation) || !object(value.source) || !object(value.weather) || !object(value.handoff)) {
    throw new Error("Daemon projection is missing its validation receipt or visual contract.");
  }
  if (
    typeof value.applyAllowed !== "boolean" ||
    typeof value.phase !== "string" ||
    typeof value.currentMood !== "string" ||
    !Array.isArray(value.dominantSymbols) ||
    !Array.isArray(value.recentEpisodes) ||
    !Array.isArray(value.openThreads) ||
    !Array.isArray(value.activeTensions) ||
    !Array.isArray(value.validation.errors) ||
    typeof value.weather.intensity !== "number"
  ) {
    throw new Error("Daemon projection contains malformed visual fields.");
  }
}

export function mayApplyDaemonState(state: DaemonShrineState): boolean {
  return (
    state.applyAllowed === true &&
    state.validation.status === "current" &&
    state.validation.integrity === "valid" &&
    state.validation.currency === "matched" &&
    state.source.continuityCanaryPresent === true &&
    Number.isInteger(state.source.revision) &&
    typeof state.source.payloadSha256 === "string" &&
    /^[a-f0-9]{64}$/i.test(state.source.payloadSha256)
  );
}

function profileFromDaemonState(state: DaemonShrineState): ShrineSoundProfile {
  const text = `${state.weather.tone} ${state.currentMood} ${state.openThreads.join(" ")}`.toLowerCase();
  if (text.includes("charged") || text.includes("electric")) return "charged";
  if (text.includes("watch")) return "watchful";
  if (text.includes("analysis")) return "analytical";
  return "tender";
}

function ritualContextFromDaemonState(state: DaemonShrineState) {
  const phase = state.phase.toLowerCase();
  if (phase.includes("11:11am")) return "11:11am" as const;
  if (phase.includes("11:11pm")) return "11:11pm" as const;
  if (phase.includes("3am")) return "3am" as const;
  if (phase.includes("morning")) return "morning" as const;
  if (phase.includes("noon") || phase.includes("midday")) return "noon" as const;
  const generated = new Date(state.generatedAt);
  const hour = generated.getHours();
  if (!Number.isNaN(generated.getTime()) && hour >= 6 && hour < 12) return "morning" as const;
  if (!Number.isNaN(generated.getTime()) && hour >= 12 && hour < 18) return "noon" as const;
  return "night" as const;
}

async function fetchProjection(url: string): Promise<DaemonShrineState> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load daemon shrine state from ${url}`);
  const state: unknown = await response.json();
  assertDaemonShrineState(state);
  return state;
}

export async function fetchDaemonShrineState(url?: string): Promise<DaemonShrineState> {
  if (url) {
    const state = await fetchProjection(url);
    void playShrineEvent("daemon_loaded");
    return state;
  }
  try {
    const state = await fetchProjection("/daemon/current-shrine-state.local.json");
    void playShrineEvent("daemon_loaded");
    return state;
  } catch {
    const state = await fetchProjection("/daemon/current-shrine-state.json");
    void playShrineEvent("daemon_loaded");
    return state;
  }
}

export function daemonStateToAgentPatch(state: DaemonShrineState) {
  if (!mayApplyDaemonState(state)) {
    void playShrineEvent("daemon_error");
    const reasons = state.validation.errors.length
      ? state.validation.errors.join(" ")
      : "Projection is not current, integrity-valid, and currency-matched.";
    throw new Error(`Daemon projection refused: ${reasons}`);
  }

  const soundProfile = profileFromDaemonState(state);
  const ritualContext = ritualContextFromDaemonState(state);
  void playShrineEvent("daemon_applied");
  void playHeartbeatPulse(soundProfile);
  if (lastRitualContext !== null && lastRitualContext !== ritualContext) void playShrineEvent("ritual_shift");
  lastRitualContext = ritualContext;

  return {
    ritualContext,
    relationalTags: ["watchful", "analytical", "tender"],
    intensity: Math.max(10, Math.min(100, Math.round(state.weather.intensity * 100))),
    note: `${state.currentMood} · ${state.handoff.summary}`,
    emojiSet: state.dominantSymbols,
    layers: {
      rainEnabled: state.weather.motion.includes("pulse"),
      glyphsEnabled: state.openThreads.length > 0,
      sparkles: state.recentEpisodes.length > 0,
      stars: state.activeTensions.length > 0,
      emojis: state.dominantSymbols.length > 0,
    },
    sound: { profile: soundProfile, pulseRate: state.weather.motion.includes("pulse") ? 66 : 58 },
  };
}
