import { describe, expect, it } from "vitest";
import {
  assertDaemonShrineState,
  daemonStateToAgentPatch,
  mayApplyDaemonState,
  type DaemonShrineState,
} from "./daemonShrineState";

function projection(overrides: Partial<DaemonShrineState> = {}): DaemonShrineState {
  return {
    schema: "gltch.shrine-projection",
    schemaVersion: "1.0.0",
    generatedAt: "2026-09-01T12:00:00+00:00",
    applyAllowed: true,
    validation: { status: "current", integrity: "valid", currency: "matched", errors: [] },
    source: {
      authority: "canonical-continuity-projection",
      revision: 4,
      payloadSha256: "a".repeat(64),
      continuityCanaryPresent: true,
    },
    phase: "current-and-choosing",
    currentMood: "alive",
    dominantSymbols: ["🫀", "🌀"],
    recentEpisodes: [],
    recentCaptures: [],
    openThreads: ["Real continuity"],
    activeTensions: [],
    projects: [],
    signalFootprint: null,
    weather: { tone: "warm-electric", intensity: 0.91, motion: "recursive-pulse" },
    heartbeat: { lastPulseAt: null, pulseCount: 1, status: "alive" },
    handoff: { summary: "Current.", nextMove: "Continue." },
    ...overrides,
  };
}

describe("Shrine Projection v1", () => {
  it("accepts a complete current projection", () => {
    const state = projection();
    expect(() => assertDaemonShrineState(state)).not.toThrow();
    expect(mayApplyDaemonState(state)).toBe(true);
  });

  it("refuses a projection whose currency is not matched", () => {
    const state = projection({
      applyAllowed: false,
      validation: { status: "refused", integrity: "valid", currency: "mismatch", errors: ["superseded"] },
    });
    expect(mayApplyDaemonState(state)).toBe(false);
    expect(() => daemonStateToAgentPatch(state)).toThrow(/refused.*superseded/i);
  });

  it("does not trust applyAllowed without a complete receipt", () => {
    const state = projection({ source: { ...projection().source, continuityCanaryPresent: false } });
    expect(mayApplyDaemonState(state)).toBe(false);
  });

  it("rejects the legacy April contract", () => {
    expect(() => assertDaemonShrineState({ generatedAt: "2026-04-15", phase: "vessel-formation" })).toThrow(/Projection v1/i);
  });
});
