# Respite

**A calm, open-source 20-20-20 eye-care companion for developers.**

Respite gently reminds you to look away from the screen every 20 minutes — without nagging, without accounts, and without shipping your data anywhere.

> Wellness habit tool. Not a medical device. See [docs/MEDICAL_DISCLAIMER.md](docs/MEDICAL_DISCLAIMER.md).

![Respite](public/icons/icon128.png)

## Why Respite

Long coding days are hard on eyes. Most people know the 20-20-20 rule and still forget it mid-debug. Existing reminders are often loud, guilt-heavy, or only work in one app.

Respite aims to be:

- **Almost zero friction** — load the extension and go
- **Quiet** — idle-aware, snoozeable, skippable
- **Local-only** — settings and stats stay on your machine
- **Honest** — no disease-prevention claims

## Features (MVP)

- Configurable work interval (default 20 minutes) and break length (default 20 seconds)
- Gentle desktop notification + calming full-tab break screen
- Pause / resume / snooze / take a break now
- Idle awareness via the browser Idle API
- Quiet hours
- Local daily stats, adherence, and streak
- Manifest V3 Chromium extension (Chrome, Edge, Brave, Arc, …)

## Load unpacked (development)

```bash
npm install
npm run dev
```

Then in Chrome/Edge:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist` folder Vite/CRX prints (usually `dist/`)

For a production build:

```bash
npm run build
```

Load the generated `dist/` folder the same way.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Extension dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run typecheck` | TypeScript check |

## Privacy

No analytics. No accounts. No network calls. Details: [docs/PRIVACY.md](docs/PRIVACY.md).

## License

MIT — see [LICENSE](LICENSE).

## Roadmap (not in MVP)

- Firefox package
- Shared core for a future Tauri desktop companion
- Optional VS Code integration
- Optional team wellness features (privacy-preserving)
