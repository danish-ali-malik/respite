# Chrome Web Store listing kit

Use these fields when you submit Respite in the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Privacy policy URL (after GitHub Pages is live):

**https://danish-ali-malik.github.io/respite/privacy.html**

Fallback (also acceptable):  
https://github.com/danish-ali-malik/respite/blob/main/docs/PRIVACY.md

---

## Package to upload

Zip the **contents** of `dist/` (so `manifest.json` is at the zip root):

```bash
cd dist && zip -r ../respite-extension.zip .
```

Or upload the existing release asset `respite-extension.zip`.

---

## Store listing

### Name
Respite — Eye Care for Developers

### Summary (short description, ≤132 characters)
Calm 20-20-20 eye-break reminders for developers. Idle-aware, local-only, no accounts. Wellness tool — not a medical device.

### Description (detailed)

```
Protect your eyes while you code.

Respite is a free, open-source Chrome extension that gently reminds you to follow the 20-20-20 rule: every 20 minutes, look about 20 feet (6 metres) away for 20 seconds.

Built for developers and other heavy computer users who forget to take breaks mid-debug, mid-PR, or mid-deadline.

WHAT YOU GET
• Configurable work interval and break length (defaults to 20 / 20)
• Quiet notifications and a calming full-tab break screen
• Idle awareness — pauses when you step away
• Snooze, pause, skip, or take a break now
• Quiet hours for nights and focus blocks
• Local habit stats (completed, skipped, streak) — stored only on your device

PRIVACY FIRST
No accounts. No analytics. No network requests. Settings and stats stay in local storage on your computer.

IMPORTANT
Respite is a wellness habit tool, not a medical device. It does not diagnose, treat, or prevent eye disease, and it does not replace professional eye care.

Open source (MIT): https://github.com/danish-ali-malik/respite
```

### Category
Productivity  
(alternate: Lifestyle)

### Language
English

---

## Graphic assets (in this folder)

| Asset | Path | Size |
|---|---|---|
| Store icon | `store/icons/icon-128.png` | 128×128 |
| Screenshot 1 — Popup | `store/screenshots/01-popup-1280x800.png` | 1280×800 |
| Screenshot 2 — Break | `store/screenshots/02-break-1280x800.png` | 1280×800 |
| Screenshot 3 — Settings | `store/screenshots/03-settings-1280x800.png` | 1280×800 |
| Small promo tile (optional) | `store/promo/small-tile-440x280.png` | 440×280 |
| Marquee promo (optional) | `store/promo/marquee-1400x560.png` | 1400×560 |

Also upload the extension’s built-in `public/icons/icon128.png` if the dashboard asks for an icon from the package (already inside the zip).

---

## Privacy practices tab

### Single purpose
Gently remind users to take short 20-20-20 eye breaks during screen work, with optional local habit stats.

### Remote code
No, I am not using remote code.

### Permission justifications

**alarms**  
Used to schedule reliable work-interval and break timers in the Manifest V3 service worker so reminders fire even when the popup is closed.

**idle**  
Used to detect when the user is away from the computer so the timer can pause or reset and avoid unnecessary reminders.

**notifications**  
Used to show optional desktop notifications when a break is due. Users can disable notifications in settings.

**storage**  
Used to save user settings and local-only habit statistics on the device via chrome.storage.local. No data is sent to a server.

**tabs**  
Used only to open the extension’s break-screen page when a reminder starts. The extension does not read or modify website content and requests no host permissions.

### Data usage / collection
Select that you do **not** collect user data / personally identifiable information (or only store data locally on the user’s device, matching the dashboard wording).  
Certify compliance with the limited use policies as shown in the form.

### Privacy policy URL
https://danish-ali-malik.github.io/respite/privacy.html

---

## Distribution

- Visibility: **Public**
- Pricing: **Free**
- Regions: All regions (or your preference)

---

## Test instructions (optional but helpful)

```
1. Install the extension and allow notifications if prompted.
2. Open the popup — timer should be running (default 20 minutes).
3. Click “Take a break now” — a break tab should open with a countdown.
4. Open Options/Settings — change work interval and confirm it saves.
5. Leave the machine idle for a few minutes — timer should pause/reset per idle settings.
6. Confirm no network requests in DevTools (extension pages only use local storage).
```
