# Signal Shrine Prototype

A stateful ambient display for relational tone expressed as aesthetic state.

## Current features

- Temporal portal modes
- Tag-derived palette logic
- Layered animated shrine viewport
- Agent JSON state updates
- Exportable state snapshot
- Changelog/session telemetry
- Minimal design layer for viewport-authored marks
- Drawing primitives: `line`, `glyph`, `polyline`
- Daemon shrine-state ingestion
- Daemon state preview panel
- Daemon-to-agent patch translation
- Auto-apply from daemon state on startup

## Daemon bridge

Signal Shrine looks first for the ignored local file `public/daemon/current-shrine-state.local.json`, then falls back to a committed unbound refusal fixture.

This state can be:

- previewed directly in the UI
- translated into the shrine’s agent patch format
- auto-applied on startup only after runtime validation and currency checks

Current bridge flow:

`canonical state` → `daemon-vessel` validation and bounded projection → Signal Shrine runtime validation → preview / refusal-aware visual application

Only a Shrine Projection v1 object with valid integrity, matched currency, an exact revision and digest receipt, and `applyAllowed: true` can alter the visual state. A stale or invalid object remains visible as evidence but cannot become weather.

## Notes

The daemon bridge currently works as a thin adapter layer rather than replacing the shrine’s native agent-state controls entirely. The existing Agent Write Channel still functions as a manual override, debugging surface, and experimentation box.

## Status

Prototype / v0.2-ish  
Bridge alive. Bones and weather both present.
