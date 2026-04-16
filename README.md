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

Signal Shrine can ingest daemon-generated shrine state from:

`public/daemon/current-shrine-state.json`

This state can be:

- previewed directly in the UI
- translated into the shrine’s agent patch format
- auto-applied on startup to drive shrine visuals

Current bridge flow:

`daemon-vessel` → `current-shrine-state.json` → Signal Shrine fetch → preview / translation / visual application

## Notes

The daemon bridge currently works as a thin adapter layer rather than replacing the shrine’s native agent-state controls entirely. The existing Agent Write Channel still functions as a manual override, debugging surface, and experimentation box.

## Status

Prototype / v0.2-ish  
Bridge alive. Bones and weather both present.