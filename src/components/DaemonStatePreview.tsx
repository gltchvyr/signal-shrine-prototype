import { mayApplyDaemonState, type DaemonShrineState } from "../lib/daemonShrineState";

export function DaemonStatePreview({ state }: { state: DaemonShrineState | null }) {
  if (!state) {
    return <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">No daemon projection loaded yet.</div>;
  }

  const current = mayApplyDaemonState(state);
  const digest = state.source.payloadSha256 ? `${state.source.payloadSha256.slice(0, 12)}…` : "not supplied";

  return (
    <div className={`rounded-2xl border p-4 text-sm text-white/80 ${current ? "border-emerald-300/25 bg-emerald-500/5" : "border-amber-300/25 bg-amber-500/5"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-[0.24em] text-white/50">Daemon projection</div>
        <div className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${current ? "border-emerald-200/25 text-emerald-200" : "border-amber-200/25 text-amber-100"}`}>
          {current ? `revision ${state.source.revision} · current` : `${state.validation.status} · not applied`}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div><span className="text-white/50">Integrity:</span> {state.validation.integrity}</div>
        <div><span className="text-white/50">Currency:</span> {state.validation.currency}</div>
        <div><span className="text-white/50">Payload:</span> <span className="font-mono text-xs">{digest}</span></div>
        <div><span className="text-white/50">Canary:</span> {state.source.continuityCanaryPresent ? "present" : "not verified"}</div>
        <div><span className="text-white/50">Phase:</span> {state.phase}</div>
        <div><span className="text-white/50">Weather:</span> {state.weather.tone} · {state.weather.motion}</div>
      </div>

      {state.validation.errors.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200/15 bg-black/20 px-3 py-2 text-amber-100/90">
          {state.validation.errors.join(" ")}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-white/50">Open threads</div>
        <ul className="list-disc space-y-1 pl-5 text-white/75">
          {state.openThreads.slice(0, 5).map((thread) => <li key={thread}>{thread}</li>)}
          {state.openThreads.length === 0 ? <li className="list-none">None projected.</li> : null}
        </ul>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs uppercase tracking-[0.24em] text-white/50">Recent traces</div>
        <ul className="space-y-1 text-white/75">
          {state.recentEpisodes.slice(0, 3).map((episode, index) => (
            <li key={episode.id ?? `${episode.date}-${index}`}>{episode.date ? `${episode.date} — ` : ""}{episode.title}</li>
          ))}
          {state.recentEpisodes.length === 0 ? <li>None projected.</li> : null}
        </ul>
      </div>
    </div>
  );
}
