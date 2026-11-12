import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  DEFAULT_TIMER_STATE,
  emptyDayStats,
  todayKey,
  type Settings,
  type Stats,
  type TimerState,
} from "./types";

const KEYS = {
  settings: "settings",
  timer: "timer",
  stats: "stats",
} as const;

function mergeSettings(raw: Partial<Settings> | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
}

function rollStats(stats: Stats): Stats {
  const today = todayKey();
  if (stats.today.date === today) return stats;

  const history = [...stats.history, stats.today]
    .filter((d) => d.date !== today)
    .slice(-14);

  let streak = stats.streak;
  if (stats.lastActiveDate) {
    const last = new Date(stats.lastActiveDate + "T12:00:00");
    const prev = new Date(today + "T12:00:00");
    prev.setDate(prev.getDate() - 1);
    const yesterday = todayKey(prev);
    if (stats.lastActiveDate !== yesterday && stats.lastActiveDate !== today) {
      streak = 0;
    }
  }

  return {
    ...stats,
    today: emptyDayStats(today),
    history,
    streak,
  };
}

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get(KEYS.settings);
  return mergeSettings(data[KEYS.settings] as Partial<Settings> | undefined);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [KEYS.settings]: settings });
}

export async function getTimerState(): Promise<TimerState> {
  const data = await chrome.storage.local.get(KEYS.timer);
  return { ...DEFAULT_TIMER_STATE, ...(data[KEYS.timer] as Partial<TimerState> | undefined) };
}

export async function saveTimerState(timer: TimerState): Promise<void> {
  await chrome.storage.local.set({
    [KEYS.timer]: { ...timer, updatedAt: Date.now() },
  });
}

export async function getStats(): Promise<Stats> {
  const data = await chrome.storage.local.get(KEYS.stats);
  const raw = { ...DEFAULT_STATS, ...(data[KEYS.stats] as Partial<Stats> | undefined) };
  const rolled = rollStats(raw);
  if (rolled !== raw) {
    await chrome.storage.local.set({ [KEYS.stats]: rolled });
  }
  return rolled;
}

export async function saveStats(stats: Stats): Promise<void> {
  await chrome.storage.local.set({ [KEYS.stats]: stats });
}

export async function recordBreak(
  kind: "completed" | "skipped" | "snoozed",
): Promise<Stats> {
  const stats = await getStats();
  const today = { ...stats.today };
  today[kind] += 1;

  let streak = stats.streak;
  let lastActiveDate = stats.lastActiveDate;

  if (kind === "completed") {
    const date = todayKey();
    if (lastActiveDate !== date) {
      const prev = new Date(date + "T12:00:00");
      prev.setDate(prev.getDate() - 1);
      const yesterday = todayKey(prev);
      streak = lastActiveDate === yesterday || lastActiveDate === date ? streak + 1 : 1;
      lastActiveDate = date;
    }
  }

  const next: Stats = { ...stats, today, streak, lastActiveDate };
  await saveStats(next);
  return next;
}

export async function getAllState(): Promise<{
  settings: Settings;
  timer: TimerState;
  stats: Stats;
}> {
  const [settings, timer, stats] = await Promise.all([
    getSettings(),
    getTimerState(),
    getStats(),
  ]);
  return { settings, timer, stats };
}
