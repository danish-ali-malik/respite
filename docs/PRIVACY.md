# Privacy

Respite is privacy-first by design.

## What we store

- Extension settings (intervals, quiet hours, notification preferences)
- Local habit stats (breaks completed/skipped, short streak history)

All of this lives in `chrome.storage.local` on your device.

## What we do not do

- No accounts or authentication
- No analytics or telemetry
- No remote servers
- No keystroke, screenshot, webcam, or code monitoring
- No network requests from the extension

## Permissions explained

| Permission | Why |
|---|---|
| `alarms` | Reliable 20-minute work timers in Manifest V3 service workers |
| `idle` | Pause or reset when you step away from the computer |
| `notifications` | Optional gentle break reminders |
| `storage` | Save settings and local stats |
| `tabs` | Open the calm break screen when a reminder fires |

## Contact

Questions about privacy: open a GitHub issue on [danish-ali-malik/respite](https://github.com/danish-ali-malik/respite).
