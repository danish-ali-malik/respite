import {
  getAllState,
  getSettings,
  getTimerState,
  recordBreak,
  recordStand,
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
const STAND_UP_ALARM = "respite-stand-up";
const STAND_ALARM = "respite-stand";
const BREAK_URL = "src/break/index.html";
const STAND_URL = "src/stand/index.html";
const RETURN_TAB_KEY = "returnTabId";
const RETURN_WINDOW_KEY = "returnWindowId";
const NOTIFICATION_DISMISS_MS = 6_000;

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await saveSettings(DEFAULT_SETTINGS);
    await saveTimerState(DEFAULT_TIMER_STATE);
    if (DEFAULT_SETTINGS.autoStart) {
      await startWorkCycle();
    }
    await chrome.runtime.openOptionsPage().catch(() => undefined);
  } else if (details.reason === "update") {
    // Ensure new settings defaults merge in for existing installs
    const settings = await getSettings();
    await saveSettings(settings);
    await restoreOrStart();
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
      if (remaining > 0) {
        await pauseTimer(true);
      }
    }
    return;
  }

  if (timer.status === "idle" || timer.status === "paused") {
    const idleMs = settings.idleThresholdMinutes * 60_000;
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
  } else if (alarm.name === STAND_UP_ALARM) {
    await onStandUpDue();
  } else if (alarm.name === STAND_ALARM) {
    await onStandComplete();
  }
});

chrome.notifications.onClicked.addListener(async (id) => {
  if (id.startsWith("respite-break")) {
    await openBreakPage();
    await chrome.notifications.clear(id);
  } else if (id.startsWith("respite-stand")) {
    await openStandPage();
    await chrome.notifications.clear(id);
  }
});

chrome.notifications.onButtonClicked.addListener(async (id, buttonIndex) => {
  if (id.startsWith("respite-break")) {
    if (buttonIndex === 0) await openBreakPage();
    else if (buttonIndex === 1) await snooze();
    await chrome.notifications.clear(id);
    return;
  }
  if (id.startsWith("respite-stand")) {
    if (buttonIndex === 0) await openStandPage();
    else if (buttonIndex === 1) await snoozeStand();
    await chrome.notifications.clear(id);
  }
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
      case "OPEN_STAND":
        await openStandPage();
        sendResponse({ ok: true });
        break;
      case "STAND_NOW":
        await beginStand();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "SKIP_STAND":
        await skipStand();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "COMPLETE_STAND":
        await completeStand();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "SNOOZE_STAND":
        await snoozeStand();
        sendResponse({ type: "STATE", payload: await getAllState() });
        break;
      case "SETTINGS_UPDATED":
        await saveSettings(message.settings);
        await applyIdleThreshold(message.settings);
        await rescheduleStandUpFromSettings(message.settings);
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

async function clearEyeAlarms() {
  await chrome.alarms.clear(WORK_ALARM);
  await chrome.alarms.clear(BREAK_ALARM);
}

async function clearStandAlarms() {
  await chrome.alarms.clear(STAND_UP_ALARM);
  await chrome.alarms.clear(STAND_ALARM);
}

async function startWorkCycle(remainingMs?: number) {
  const settings = await getSettings();
  await applyIdleThreshold(settings);
  await clearEyeAlarms();

  const duration = remainingMs ?? settings.workMinutes * 60_000;
  const workEndsAt = Date.now() + duration;
  const prev = await getTimerState();

  const timer: TimerState = {
    ...prev,
    status: "running",
    workEndsAt,
    breakEndsAt: null,
    standEndsAt: null,
    pausedRemainingMs: null,
    updatedAt: Date.now(),
  };
  await saveTimerState(timer);
  await chrome.alarms.create(WORK_ALARM, { when: workEndsAt });
  await updateBadge("work", duration);
  await ensureStandUpScheduled();
}

async function pauseTimer(asIdle: boolean) {
  const timer = await getTimerState();
  if (timer.status !== "running" && timer.status !== "break" && timer.status !== "stand") {
    return;
  }

  await clearEyeAlarms();
  await clearStandAlarms();

  let pausedRemainingMs: number | null = null;
  if (timer.status === "running" && timer.workEndsAt) {
    pausedRemainingMs = Math.max(0, timer.workEndsAt - Date.now());
  }

  let standPausedRemainingMs: number | null = timer.standPausedRemainingMs;
  if (timer.standUpEndsAt) {
    standPausedRemainingMs = Math.max(0, timer.standUpEndsAt - Date.now());
  }

  await saveTimerState({
    ...timer,
    status: asIdle ? "idle" : "paused",
    workEndsAt: null,
    breakEndsAt: null,
    standUpEndsAt: null,
    standEndsAt: null,
    pausedRemainingMs,
    standPausedRemainingMs,
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
  await clearEyeAlarms();
  await restoreWorkTabAndCloseOverlay();
  await startWorkCycle(settings.snoozeMinutes * 60_000);
}

async function onWorkComplete() {
  const settings = await getSettings();
  if (isInQuietHours(settings)) {
    await startWorkCycle(5 * 60_000);
    return;
  }
  await beginBreak();
}

async function beginBreak() {
  const settings = await getSettings();
  await clearEyeAlarms();
  await captureReturnTab();

  const prev = await getTimerState();
  const breakEndsAt = Date.now() + settings.breakSeconds * 1000;
  await saveTimerState({
    ...prev,
    status: "break",
    workEndsAt: null,
    breakEndsAt,
    standEndsAt: null,
    pausedRemainingMs: null,
    updatedAt: Date.now(),
  });
  await chrome.alarms.create(BREAK_ALARM, { when: breakEndsAt });
  await updateBadge("break", settings.breakSeconds * 1000);

  if (settings.notificationsEnabled) {
    await showBreakNotification(settings.breakSeconds);
  }

  await openBreakPage();
}

async function showBreakNotification(breakSeconds: number) {
  const id = `respite-break-${Date.now()}`;
  await chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Time for a short eye break",
    message: `Look about 20 feet (6 m) away for ${breakSeconds} seconds.`,
    buttons: [{ title: "Start break" }, { title: "Snooze" }],
    priority: 1,
    requireInteraction: false,
  });
  setTimeout(() => {
    void chrome.notifications.clear(id);
  }, NOTIFICATION_DISMISS_MS);
}

async function showStandNotification(standSeconds: number) {
  const id = `respite-stand-${Date.now()}`;
  await chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Time to stand and stretch",
    message: `Stand up for about ${standSeconds} seconds — a short reset for your back and shoulders.`,
    buttons: [{ title: "Stand now" }, { title: "Snooze" }],
    priority: 1,
    requireInteraction: false,
  });
  setTimeout(() => {
    void chrome.notifications.clear(id);
  }, NOTIFICATION_DISMISS_MS);
}

async function ensureStandUpScheduled(remainingMs?: number) {
  const settings = await getSettings();
  await chrome.alarms.clear(STAND_UP_ALARM);
  if (!settings.standUpEnabled) {
    const timer = await getTimerState();
    await saveTimerState({
      ...timer,
      standUpEndsAt: null,
      standPausedRemainingMs: null,
    });
    return;
  }

  const timer = await getTimerState();
  if (timer.status === "paused" || timer.status === "idle" || timer.status === "stand") {
    return;
  }

  const duration =
    remainingMs ??
    timer.standPausedRemainingMs ??
    settings.standUpMinutes * 60_000;
  const standUpEndsAt = Date.now() + Math.max(5_000, duration);
  await saveTimerState({
    ...timer,
    standUpEndsAt,
    standPausedRemainingMs: null,
  });
  await chrome.alarms.create(STAND_UP_ALARM, { when: standUpEndsAt });
}

async function rescheduleStandUpFromSettings(settings: Settings) {
  await chrome.alarms.clear(STAND_UP_ALARM);
  if (!settings.standUpEnabled) {
    const timer = await getTimerState();
    await saveTimerState({
      ...timer,
      standUpEndsAt: null,
      standPausedRemainingMs: null,
    });
    return;
  }
  const timer = await getTimerState();
  if (timer.status === "running" || timer.status === "break") {
    await ensureStandUpScheduled(settings.standUpMinutes * 60_000);
  }
}

async function onStandUpDue() {
  const settings = await getSettings();
  const timer = await getTimerState();

  if (!settings.standUpEnabled) return;

  if (isInQuietHours(settings)) {
    await ensureStandUpScheduled(5 * 60_000);
    return;
  }

  // Don't interrupt an eye break — try again shortly after
  if (timer.status === "break") {
    await ensureStandUpScheduled(2 * 60_000);
    return;
  }

  if (timer.status === "paused" || timer.status === "idle") {
    return;
  }

  await beginStand();
}

async function beginStand() {
  const settings = await getSettings();

  await chrome.alarms.clear(STAND_UP_ALARM);
  await captureReturnTab();

  const prev = await getTimerState();
  // Pause the eye work countdown while standing
  let pausedRemainingMs = prev.pausedRemainingMs;
  if (prev.status === "running" && prev.workEndsAt) {
    pausedRemainingMs = Math.max(0, prev.workEndsAt - Date.now());
    await chrome.alarms.clear(WORK_ALARM);
  }

  const standEndsAt = Date.now() + settings.standUpSeconds * 1000;
  await saveTimerState({
    ...prev,
    status: "stand",
    workEndsAt: null,
    breakEndsAt: null,
    standUpEndsAt: null,
    standEndsAt,
    pausedRemainingMs,
    updatedAt: Date.now(),
  });
  await chrome.alarms.create(STAND_ALARM, { when: standEndsAt });
  await updateBadge("stand", settings.standUpSeconds * 1000);

  if (settings.notificationsEnabled) {
    await showStandNotification(settings.standUpSeconds);
  }

  await openStandPage();
}

async function completeStand() {
  await recordStand();
  await chrome.alarms.clear(STAND_ALARM);
  const timer = await getTimerState();
  const remaining = timer.pausedRemainingMs;
  if (remaining && remaining > 0) {
    await startWorkCycle(remaining);
  } else {
    await startWorkCycle();
  }
  await ensureStandUpScheduled();
  await new Promise((resolve) => setTimeout(resolve, 900));
  await restoreWorkTabAndCloseOverlay();
}

async function skipStand() {
  await chrome.alarms.clear(STAND_ALARM);
  const timer = await getTimerState();
  const remaining = timer.pausedRemainingMs;
  await restoreWorkTabAndCloseOverlay();
  if (remaining && remaining > 0) {
    await startWorkCycle(remaining);
  } else {
    await startWorkCycle();
  }
  await ensureStandUpScheduled();
}

async function snoozeStand() {
  const settings = await getSettings();
  await chrome.alarms.clear(STAND_ALARM);
  const timer = await getTimerState();
  const remaining = timer.pausedRemainingMs;
  await restoreWorkTabAndCloseOverlay();
  if (remaining && remaining > 0) {
    await startWorkCycle(remaining);
  } else {
    await startWorkCycle();
  }
  await ensureStandUpScheduled(settings.snoozeMinutes * 60_000);
}

async function onStandComplete() {
  const timer = await getTimerState();
  if (timer.status === "stand") {
    await completeStand();
  }
}

async function captureReturnTab() {
  try {
    const [active] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (!active?.id) return;

    const extensionOrigin = chrome.runtime.getURL("");
    if (active.url?.startsWith(extensionOrigin)) return;

    await chrome.storage.session.set({
      [RETURN_TAB_KEY]: active.id,
      [RETURN_WINDOW_KEY]: active.windowId,
    });
  } catch {
    // ignore
  }
}

async function restoreWorkTabAndCloseOverlay() {
  const data = await chrome.storage.session.get([
    RETURN_TAB_KEY,
    RETURN_WINDOW_KEY,
  ]);
  const tabId = data[RETURN_TAB_KEY] as number | undefined;
  const windowId = data[RETURN_WINDOW_KEY] as number | undefined;
  await chrome.storage.session.remove([RETURN_TAB_KEY, RETURN_WINDOW_KEY]);

  if (tabId != null) {
    try {
      await chrome.tabs.update(tabId, { active: true });
      if (windowId != null) {
        await chrome.windows.update(windowId, { focused: true });
      }
    } catch {
      // Previous tab may have been closed
    }
  }

  const breakUrl = chrome.runtime.getURL(BREAK_URL);
  const standUrl = chrome.runtime.getURL(STAND_URL);
  const overlayTabs = await chrome.tabs.query({
    url: [breakUrl, standUrl],
  });
  await Promise.all(
    overlayTabs
      .map((tab) => tab.id)
      .filter((id): id is number => typeof id === "number")
      .map((id) => chrome.tabs.remove(id).catch(() => undefined)),
  );

  await clearOverlayNotifications();
}

async function clearOverlayNotifications() {
  try {
    const all = await chrome.notifications.getAll();
    await Promise.all(
      Object.keys(all)
        .filter((id) => id.startsWith("respite-break") || id.startsWith("respite-stand"))
        .map((id) => chrome.notifications.clear(id)),
    );
  } catch {
    // ignore
  }
}

async function openExtensionPage(path: string) {
  await captureReturnTab();
  const url = chrome.runtime.getURL(path);
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

async function openBreakPage() {
  await openExtensionPage(BREAK_URL);
}

async function openStandPage() {
  await openExtensionPage(STAND_URL);
}

async function completeBreak() {
  await recordBreak("completed");
  await clearEyeAlarms();
  await startWorkCycle();
  await new Promise((resolve) => setTimeout(resolve, 900));
  await restoreWorkTabAndCloseOverlay();
}

async function skipBreak() {
  await recordBreak("skipped");
  await clearEyeAlarms();
  await restoreWorkTabAndCloseOverlay();
  await startWorkCycle();
}

async function onBreakComplete() {
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
      if (timer.standUpEndsAt && timer.standUpEndsAt > Date.now() + 1000) {
        await chrome.alarms.create(STAND_UP_ALARM, { when: timer.standUpEndsAt });
      } else {
        await ensureStandUpScheduled();
      }
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

  if (timer.status === "stand" && timer.standEndsAt) {
    const remaining = timer.standEndsAt - Date.now();
    if (remaining > 500) {
      await chrome.alarms.create(STAND_ALARM, { when: timer.standEndsAt });
      await updateBadge("stand", remaining);
      await openStandPage();
      return;
    }
    await completeStand();
    return;
  }

  if (timer.status === "paused" || timer.status === "idle") {
    await updateBadge(timer.status, timer.pausedRemainingMs ?? 0);
  }
}

async function updateBadge(
  mode: "work" | "break" | "stand" | "paused" | "idle",
  ms: number,
) {
  const minutes = Math.max(0, Math.ceil(ms / 60_000));
  if (mode === "work") {
    await chrome.action.setBadgeBackgroundColor({ color: "#2F6F5E" });
    await chrome.action.setBadgeText({ text: minutes > 0 ? String(minutes) : "" });
  } else if (mode === "break") {
    await chrome.action.setBadgeBackgroundColor({ color: "#3D7EA6" });
    await chrome.action.setBadgeText({ text: "••" });
  } else if (mode === "stand") {
    await chrome.action.setBadgeBackgroundColor({ color: "#B8860B" });
    await chrome.action.setBadgeText({ text: "↑" });
  } else if (mode === "paused") {
    await chrome.action.setBadgeBackgroundColor({ color: "#8A7A5C" });
    await chrome.action.setBadgeText({ text: "||" });
  } else {
    await chrome.action.setBadgeBackgroundColor({ color: "#6B7280" });
    await chrome.action.setBadgeText({ text: "" });
  }
}
