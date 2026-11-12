import {
  getAllState,
  getSettings,
  getTimerState,
  recordBreak,
  saveSettings,
  saveTimerState,
} from "../lib/storage";
import { isInQuietHours } from "../lib/time";
import {
  DEFAULT_SETTINGS,
  DEFAULT_TIMER_STATE,
  type Message,
  type Settings,
  type TimerState,
} from "../lib/types";

const WORK_ALARM = "respite-work";
const BREAK_ALARM = "respite-break";
const BREAK_URL = "src/break/index.html";

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await saveSettings(DEFAULT_SETTINGS);
    await saveTimerState(DEFAULT_TIMER_STATE);
    if (DEFAULT_SETTINGS.autoStart) {
      await startWorkCycle();
    }
    await chrome.runtime.openOptionsPage().catch(() => undefined);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  const timer = await getTimerState();
  if (settings.autoStart && timer.status !== "paused") {
    await restoreOrStart();
  } else if (settings.autoStart && timer.status === "paused" && !timer.pausedRemainingMs) {
    await startWorkCycle();
  } else {
    await restoreOrStart();
  }
});

chrome.idle.setDetectionInterval(60);

chrome.idle.onStateChanged.addListener(async (state) => {
  const settings = await getSettings();
  const timer = await getTimerState();

  if (state === "idle" || state === "locked") {
    if (timer.status === "running") {
      const remaining = Math.max(0, (timer.workEndsAt ?? Date.now()) - Date.now());
      // Long idle counts as a natural break — reset when they return
      if (remaining > 0) {
        await pauseTimer(true);
      }
    }
    return;
  }

  // active again
  if (timer.status === "idle" || timer.status === "paused") {
    const idleMs = settings.idleThresholdMinutes * 60_000;
    // If they were away long enough, start a fresh work cycle
    const away = Date.now() - timer.updatedAt;
    if (away >= idleMs) {
      await startWorkCycle();
    } else if (timer.pausedRemainingMs && timer.pausedRemainingMs > 0) {
      await resumeTimer();
    }
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === WORK_ALARM) {
    await onWorkComplete();
  } else if (alarm.name === BREAK_ALARM) {
    await onBreakComplete();
  }
});

chrome.notifications.onClicked.addListener(async (id) => {
  if (id.startsWith("respite-break")) {
    await openBreakPage();
    await chrome.notifications.clear(id);
  }
});

chrome.notifications.onButtonClicked.addListener(async (id, buttonIndex) => {
  if (!id.startsWith("respite-break")) return;
  if (buttonIndex === 0) {
    await openBreakPage();
  } else if (buttonIndex === 1) {
    await snooze();
  }
  await chrome.notifications.clear(id);
});

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  void (async () => {
    switch (message.type) {
      case "GET_STATE":
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "START":
        await startWorkCycle();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "PAUSE":
        await pauseTimer(false);
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "RESUME":
        await resumeTimer();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "SNOOZE":
        await snooze();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "SKIP_BREAK":
        await skipBreak();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "COMPLETE_BREAK":
        await completeBreak();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "TAKE_BREAK_NOW":
        await beginBreak();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "OPEN_BREAK":
        await openBreakPage();
        sendResponse({ ok: true });
        break;
      case "SETTINGS_UPDATED":
        await saveSettings(message.settings);
        await applyIdleThreshold(message.settings);
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      default:
        sendResponse({ ok: false });
    }
  })();
  return true;
});

async function applyIdleThreshold(settings: Settings) {
  const seconds = Math.max(15, Math.min(60 * 60, settings.idleThresholdMinutes * 60));
  chrome.idle.setDetectionInterval(seconds);
}

async function clearAlarms() {
  await chrome.alarms.clear(WORK_ALARM);
  await chrome.alarms.clear(BREAK_ALARM);
}

async function startWorkCycle(remainingMs?: number) {
  const settings = await getSettings();
  await applyIdleThreshold(settings);
  await clearAlarms();

  const duration = remainingMs ?? settings.workMinutes * 60_000;
  const workEndsAt = Date.now() + duration;

  const timer: TimerState = {
    status: "running",
    workEndsAt,
    breakEndsAt: null,
    pausedRemainingMs: null,
    updatedAt: Date.now(),
  };
  await saveTimerState(timer);
  await chrome.alarms.create(WORK_ALARM, { when: workEndsAt });
  await updateBadge("work", duration);
}

async function pauseTimer(asIdle: boolean) {
  const timer = await getTimerState();
  if (timer.status !== "running" && timer.status !== "break") return;

  await clearAlarms();
  let pausedRemainingMs: number | null = null;
  if (timer.status === "running" && timer.workEndsAt) {
    pausedRemainingMs = Math.max(0, timer.workEndsAt - Date.now());
  }

  await saveTimerState({
    status: asIdle ? "idle" : "paused",
    workEndsAt: null,
    breakEndsAt: null,
    pausedRemainingMs,
    updatedAt: Date.now(),
  });
  await updateBadge(asIdle ? "idle" : "paused", pausedRemainingMs ?? 0);
}

async function resumeTimer() {
  const timer = await getTimerState();
  if (timer.status !== "paused" && timer.status !== "idle") return;
  const remaining = timer.pausedRemainingMs;
  if (remaining && remaining > 0) {
    await startWorkCycle(remaining);
  } else {
    await startWorkCycle();
  }
}

async function snooze() {
  const settings = await getSettings();
  await recordBreak("snoozed");
  await clearAlarms();
  await startWorkCycle(settings.snoozeMinutes * 60_000);
}

async function onWorkComplete() {
  const settings = await getSettings();
  if (isInQuietHours(settings)) {
    // Defer until quiet hours end — restart a short check in 5 minutes
    await startWorkCycle(5 * 60_000);
    return;
  }
  await beginBreak();
}

async function beginBreak() {
  const settings = await getSettings();
  await clearAlarms();

  const breakEndsAt = Date.now() + settings.breakSeconds * 1000;
  await saveTimerState({
    status: "break",
    workEndsAt: null,
    breakEndsAt,
    pausedRemainingMs: null,
    updatedAt: Date.now(),
  });
  await chrome.alarms.create(BREAK_ALARM, { when: breakEndsAt });
  await updateBadge("break", settings.breakSeconds * 1000);

  if (settings.notificationsEnabled) {
    await chrome.notifications.create(`respite-break-${Date.now()}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Time for a short eye break",
      message: `Look about 20 feet (6 m) away for ${settings.breakSeconds} seconds.`,
      buttons: [{ title: "Start break" }, { title: "Snooze" }],
      priority: 2,
      requireInteraction: true,
    });
  }

  await openBreakPage();
}

async function openBreakPage() {
  const url = chrome.runtime.getURL(BREAK_URL);
  const tabs = await chrome.tabs.query({ url });
  if (tabs[0]?.id) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
    return;
  }
  await chrome.tabs.create({ url, active: true });
}

async function completeBreak() {
  await recordBreak("completed");
  await clearAlarms();
  await startWorkCycle();
}

async function skipBreak() {
  await recordBreak("skipped");
  await clearAlarms();
  await startWorkCycle();
}

async function onBreakComplete() {
  // Auto-complete if the break page didn't already
  const timer = await getTimerState();
  if (timer.status === "break") {
    await completeBreak();
  }
}

async function restoreOrStart() {
  const timer = await getTimerState();
  const settings = await getSettings();
  await applyIdleThreshold(settings);

  if (timer.status === "running" && timer.workEndsAt) {
    const remaining = timer.workEndsAt - Date.now();
    if (remaining > 1000) {
      await chrome.alarms.create(WORK_ALARM, { when: timer.workEndsAt });
      await updateBadge("work", remaining);
      return;
    }
    await beginBreak();
    return;
  }

  if (timer.status === "break" && timer.breakEndsAt) {
    const remaining = timer.breakEndsAt - Date.now();
    if (remaining > 500) {
      await chrome.alarms.create(BREAK_ALARM, { when: timer.breakEndsAt });
      await updateBadge("break", remaining);
      await openBreakPage();
      return;
    }
    await completeBreak();
    return;
  }

  if (timer.status === "paused" || timer.status === "idle") {
    await updateBadge(timer.status, timer.pausedRemainingMs ?? 0);
  }
}

async function updateBadge(
  mode: "work" | "break" | "paused" | "idle",
  ms: number,
) {
  const minutes = Math.max(0, Math.ceil(ms / 60_000));
  if (mode === "work") {
    await chrome.action.setBadgeBackgroundColor({ color: "#2F6F5E" });
    await chrome.action.setBadgeText({ text: minutes > 0 ? String(minutes) : "" });
  } else if (mode === "break") {
    await chrome.action.setBadgeBackgroundColor({ color: "#3D7EA6" });
    await chrome.action.setBadgeText({ text: "••" });
  } else if (mode === "paused") {
    await chrome.action.setBadgeBackgroundColor({ color: "#8A7A5C" });
    await chrome.action.setBadgeText({ text: "||" });
  } else {
    await chrome.action.setBadgeBackgroundColor({ color: "#6B7280" });
    await chrome.action.setBadgeText({ text: "" });
  }
}
