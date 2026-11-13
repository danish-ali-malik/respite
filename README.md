# Respite

**A calm, open-source 20-20-20 eye-care companion for developers.**

Respite gently reminds you to look away from the screen every 20 minutes — without nagging, without accounts, and without shipping your data anywhere.

> Wellness habit tool. Not a medical device. See [docs/MEDICAL_DISCLAIMER.md](docs/MEDICAL_DISCLAIMER.md).

![Respite](public/icons/icon128.png)

## Install (no build required)

Works in Chrome, Edge, Brave, Arc, and other Chromium browsers.

### Option A — Download the release zip (recommended)

1. Open the [latest release](https://github.com/danish-ali-malik/respite/releases/latest)
2. Download `respite-extension.zip`
3. Unzip it somewhere permanent (not Downloads if your OS cleans that folder)
4. Open `chrome://extensions` (or `edge://extensions`)
5. Enable **Developer mode**
6. Click **Load unpacked** and select the unzipped folder (the one that contains `manifest.json`)

### Option B — Clone this repo

```bash
git clone https://github.com/danish-ali-malik/respite.git
```

Then **Load unpacked** and select the `dist/` folder inside the repo. A production build of the extension is committed so you can install without running Node.

> Tip: Pin the extension after loading so it stays in your toolbar.

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

## Develop from source

```bash
npm install
npm run dev
```

Then load the `dist/` folder as an unpacked extension (CRXJS rebuilds it as you edit).

Production build:

```bash
npm run build
```

If you change source that affects the shipped extension, run `npm run build` and commit the updated `dist/` so installers stay in sync.

### Troubleshooting

If `npm run dev` fails with `Cannot find native binding` / `@rolldown/binding-*`, pull latest `main` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

This project pins **Vite 6** so installs work the same on macOS, Linux, and Windows.

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
- Chrome Web Store listing
- Shared core for a future Tauri desktop companion
- Optional VS Code integration
- Optional team wellness features (privacy-preserving)
