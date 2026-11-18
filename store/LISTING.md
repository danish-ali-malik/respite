# Chrome Web Store listing kit (v0.1.3)

Use these fields when you submit the **0.1.3** update in the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Privacy policy URL:

**https://danish-ali-malik.github.io/respite/privacy.html**

---

## Package to upload

https://github.com/danish-ali-malik/respite/releases/tag/v0.1.3 → `respite-extension.zip`

Or:

```bash
git pull && npm install && npm run build
cd dist && zip -r ../respite-extension.zip .
```

Manifest version must be **0.1.3** (larger than published **0.1.2** / **0.1.1**).

---

## What to update on this release

| Item | Action |
|---|---|
| Package | Upload new zip (**0.1.3**) |
| Short description | Update (stand-up mentioned) |
| Detailed description | Replace with copy below |
| Screenshots | Keep 1–3; **add stand-up screenshot** if possible |
| Icon / promo tiles | No change required |
| Privacy policy URL | Same URL (still valid) |
| Single purpose | Update wording slightly (below) |
| Permission justifications | Update `notifications` + `tabs` lines (below) |
| Data usage | Still leave all collection boxes **unchecked**; certify all 3 |
| Test instructions | Update (below) |

---

## Store listing

### Name
*(unchanged)*  
Respite — Eye Care for Developers

### Summary (short description)

```
Gentle 20-20-20 eye breaks + optional stand-up nudges. Idle-aware, local-only. Wellness tool — not medical.
```

### Description (detailed)

```
Protect your eyes — and take a stand — while you code.

Respite is a free, open-source Chrome extension for developers and other heavy computer users. It gently reminds you to follow the 20-20-20 rule: every 20 minutes, look about 20 feet (6 metres) away for 20 seconds.

You can also enable stand-up nudges (for example every 30 or 60 minutes) so long sitting days get a short stretch reset.

Built for people who forget breaks mid-debug, mid-PR, or mid-deadline.

WHAT YOU GET
• Configurable eye-break interval and length (defaults to 20 min / 20 sec)
• Optional stand-up nudges (defaults to every 60 minutes)
• Quiet notifications and calming full-tab eye-break / stand screens
• Idle awareness — pauses when you step away
• Snooze, pause, skip, or take a break / stand now
• Quiet hours for nights and focus blocks
• Local habit stats (eyes, stood, skipped, streak) — stored only on your device

PRIVACY FIRST
No accounts. No analytics. No network requests. Settings and stats stay in local storage on your computer.

IMPORTANT
Respite is a wellness habit tool, not a medical device. It does not diagnose, treat, or prevent eye disease or back/spine conditions, and it does not replace professional care.

Open source (MIT): https://github.com/danish-ali-malik/respite
```

### Category
Productivity  
(alternate: Lifestyle)

### Language
English

---

## Graphic assets (ready to upload)

All screenshots are **1280×800** PNG.

| Order | File | Shows |
|---|---|---|
| 1 | `store/screenshots/01-popup-1280x800.png` | Popup with eye break + stand up |
| 2 | `store/screenshots/02-break-1280x800.png` | Eye-break screen |
| 3 | `store/screenshots/03-stand-1280x800.png` | Stand-up screen |
| 4 | `store/screenshots/04-settings-1280x800.png` | Settings with stand-up nudges |
| Icon | `store/icons/icon-128.png` | Store icon |
| Optional | `store/promo/small-tile-440x280.png` | Small promo tile |
| Optional | `store/promo/marquee-1400x560.png` | Marquee promo |
---

## Privacy practices tab

### Single purpose

```
Gently remind users to take short 20-20-20 eye breaks during screen work, with optional stand-up stretch nudges and local-only habit stats.
```

### Remote code
No, I am not using remote code.

### Permission justifications

**alarms**  
Used to schedule reliable eye-break and stand-up timers in the Manifest V3 service worker so reminders fire even when the popup is closed.

**idle**  
Used to detect when the user is away from the computer so timers can pause or reset and avoid unnecessary reminders.

**notifications**  
Used to show optional desktop notifications when an eye break or stand-up nudge is due. Users can disable notifications in settings.

**storage**  
Used to save user settings and local-only habit statistics on the device via chrome.storage.local. No data is sent to a server.

**tabs**  
Used only to open the extension’s eye-break or stand-up screen when a reminder starts. The extension does not read or modify website content and requests no host permissions.

### Data usage / collection
Leave **all** data-type boxes unchecked.  
Check **all three** certification boxes.  
Privacy policy: https://danish-ali-malik.github.io/respite/privacy.html

---

## Test instructions (for reviewers)

```
1. Install the extension and allow notifications if prompted.
2. Open the popup — eye-break timer should be running (default 20 minutes).
3. Click “Eye break now” — a break tab opens with a countdown, then returns to the previous work tab.
4. Click “Stand up now” — a stand/stretch tab opens, then returns to the previous work tab.
5. Open Settings — enable Stand-up nudges, set interval to 1 minute temporarily, confirm it saves.
6. Wait for the stand-up notification/screen; snooze or skip works.
7. Leave the machine idle for a few minutes — timers pause/reset per idle settings.
8. Confirm no network requests from the extension (local storage only).
```
