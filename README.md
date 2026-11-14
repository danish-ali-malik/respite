# Respite

**Protect your eyes while you code.**

Respite is a free, open-source Chrome extension that helps developers follow the 20-20-20 rule: every 20 minutes, look about 20 feet (6 metres) away for 20 seconds. Gentle reminders. Local-only data. No accounts.

[Install from the latest release](https://github.com/danish-ali-malik/respite/releases/latest) · [Load the `dist/` folder](#install) · [Privacy](docs/PRIVACY.md)

> Respite is a wellness habit tool — not a medical device. It does not diagnose, treat, or prevent eye disease. See the [medical disclaimer](docs/MEDICAL_DISCLAIMER.md).

---

## Why Respite

Long coding sessions are normal. Regular eye breaks are not.

Most people know they should look away from the screen. Most forget — mid-debug, mid-PR, mid-deadline. Other reminder apps get disabled because they nag at the wrong time or feel like another productivity chore.

Respite is built for that gap:

- **Quiet by default** — subtle notifications, easy snooze, easy skip
- **Idle-aware** — pauses when you step away; no pile of alerts when you return
- **Private** — settings and stats stay on your device; no analytics, no cloud
- **Ready in seconds** — download the zip, load unpacked, start working

Built by a developer, for developers who spend 8–12 hours a day on screens.

---

## Install

Works with **Chrome**, **Edge**, **Brave**, **Arc**, and other Chromium browsers.

### 1. Download

Get **`respite-extension.zip`** from the [latest release](https://github.com/danish-ali-malik/respite/releases/latest).

Or clone the repo and use the committed build:

```bash
git clone https://github.com/danish-ali-malik/respite.git
```

### 2. Load in your browser

1. Open `chrome://extensions` (or `edge://extensions`)
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the unzipped folder — or the repo’s `dist/` folder

Pin Respite in the toolbar so you can pause, snooze, or take a break anytime.

---

## What you get

| | |
|---|---|
| **20-20-20 reminders** | Default 20-minute work / 20-second break — fully configurable |
| **Calm break screen** | Full-tab countdown with a clear look-away prompt |
| **Smart idle detection** | Uses the browser Idle API so away time isn’t treated as screen time |
| **Snooze & pause** | Postpone a break or pause for deep focus without uninstalling |
| **Quiet hours** | Silence reminders overnight or on your schedule |
| **Local habit stats** | Breaks completed, skipped, adherence, and streak — stored only on your machine |

No sign-up. No tracking. No network requests.

---

## How it works

1. Respite runs quietly in the background while you browse and work.
2. When your work interval ends, you get a gentle notification and an optional break screen.
3. Look into the distance for a few seconds, blink naturally, then continue.
4. Skip or snooze whenever you need to — no guilt, no lockouts.

The 20-20-20 habit is widely recommended by eye-care organizations to help ease temporary digital eye strain from prolonged screen use. Results vary; Respite helps you practice the habit, nothing more.

---

## Privacy

- Data stays in `chrome.storage.local`
- No accounts, telemetry, or remote servers
- Permissions are limited to alarms, idle detection, notifications, storage, and tabs (to open the break screen)

Full policy: [Privacy Policy](https://danish-ali-malik.github.io/respite/privacy.html) · [source](docs/PRIVACY.md)

Chrome Web Store submission kit (icons, screenshots, listing copy): [`store/`](store/)

---

## Develop

```bash
npm install
npm run dev      # HMR — load dist/ as unpacked
npm run build    # production build into dist/
npm run typecheck
```

After source changes that affect the shipped extension, run `npm run build` and commit `dist/` so installers stay current.

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE) · Free to use, share, and improve.
