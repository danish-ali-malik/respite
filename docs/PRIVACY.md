# Privacy Policy — Respite

**Last updated:** November 14, 2026

Respite (“the Extension”) is a free, open-source browser extension that helps you practice the 20-20-20 eye-break habit. This policy explains what data is involved and how it is handled.

If you have questions, open an issue at [github.com/danish-ali-malik/respite](https://github.com/danish-ali-malik/respite).

---

## Summary

- Respite does **not** collect personal information.
- Respite does **not** use analytics, advertising, or tracking.
- Respite does **not** send data to any server.
- Settings and habit stats stay on **your device** in local extension storage.
- There are **no accounts**.

---

## Data stored on your device

Respite may store the following locally using the browser’s `storage` API (`chrome.storage.local`):

| Data | Purpose |
|---|---|
| Reminder settings (work interval, break length, snooze, quiet hours, sound/notification preferences) | Configure how reminders work |
| Timer state (running / paused / break) | Keep the schedule working across browser restarts |
| Local habit stats (breaks completed, skipped, snoozed; short history; streak) | Show your optional progress in the popup and settings page |

This data never leaves your browser unless **you** export it or back up your profile through the browser itself.

---

## Data we do not collect

Respite does **not**:

- Create accounts or require sign-in
- Collect name, email, or contact details
- Track browsing history or website content
- Read keystrokes, source code, screenshots, or webcam input
- Use cookies, fingerprinting, or third-party scripts
- Include ads or affiliate tracking
- Make network requests to our servers (there are none)

---

## Permissions

Respite requests only the permissions needed for its single purpose: gentle eye-break reminders.

| Permission | Why it is needed |
|---|---|
| `alarms` | Schedule reliable work/break timers in a Manifest V3 service worker |
| `idle` | Detect when you step away so reminders pause or reset appropriately |
| `notifications` | Show optional desktop reminders when a break is due |
| `storage` | Save settings and local habit stats on your device |
| `tabs` | Open the break screen tab when a reminder starts |

Respite does **not** request host permissions to read or change website content.

---

## Remote code

Respite does **not** execute remote code. All logic ships inside the extension package.

---

## Children’s privacy

Respite is a general productivity/wellness tool and is not directed at children. It does not knowingly collect personal information from anyone, including children.

---

## Changes to this policy

If this policy changes in a meaningful way, we will update the “Last updated” date and the copy in the GitHub repository. Continued use of the Extension after an update means you accept the revised policy.

---

## Contact

- GitHub issues: [danish-ali-malik/respite](https://github.com/danish-ali-malik/respite/issues)
- Repository: [github.com/danish-ali-malik/respite](https://github.com/danish-ali-malik/respite)
