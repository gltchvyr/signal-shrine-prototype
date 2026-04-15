import type { DaemonShrineState } from "../lib/daemonShrineState";

export function DaemonStatePreview({ state }: { state: DaemonShrineState | null }) {
  if (!state) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
        No daemon shrine state loaded yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
      <div className="mb-3 text-xs uppercase tracking-[0.24em] text-white/50">Daemon state preview</div>

      <div className="space-y-2">
        <div><span className="text-white/50">Phase:</span> {state.phase}</div>
        <div><span className="text-white/50">Mood:</span> {state.currentMood}</div>
        <div><span className="text-white/50">Weather:</span> {state.weather.tone} · {state.weather.motion}</div>
        <div><span className="text-white/50">Symbols:</span> {state.dominantSymbols.join(" ") || "none"}</div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-white/50">Open threads</div>
        <ul className="list-disc space-y-1 pl-5 text-white/75">
          {state.openThreads.slice(0, 5).map((thread) => (
            <li key={thread}>{thread}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-white/50">Recent episodes</div>
        <ul className="space-y-1 text-white/75">
          {state.recentEpisodes.slice(0, 3).map((episode) => (
            <li key={episode.id}>
              {episode.id} — {episode.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
