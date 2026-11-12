# Contributing to Respite

Thanks for helping. Keep changes focused and privacy-first.

## Setup

```bash
npm install
npm run dev
```

Load the `dist/` folder as an unpacked extension in Chrome/Edge (`chrome://extensions` → Developer mode).

## Guidelines

- Prefer local-only features; do not add analytics or network calls without discussion
- Avoid medical claims beyond temporary digital eye strain / habit support
- Keep the break experience calm — no guilt copy, no forced unskippable overlays
- Run `npm run typecheck` and `npm run build` before opening a PR

## Project layout

- `src/background` — service worker (alarms, idle, notifications)
- `src/popup` — toolbar popup
- `src/options` — settings & stats
- `src/break` — full-tab break experience
- `src/lib` — shared types, storage, helpers
