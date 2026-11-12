export type TimerStatus = "running" | "paused" | "break" | "idle";

export interface Settings {
  workMinutes: number;
  breakSeconds: number;
  snoozeMinutes: number;
  idleThresholdMinutes: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "HH:MM" 24h
  quietHoursEnd: string;
  autoStart: boolean;
}

export interface DayStats {
  date: string; // YYYY-MM-DD local
  completed: number;
  skipped: number;
  snoozed: number;
}

export interface Stats {
  today: DayStats;
  streak: number;
  lastActiveDate: string | null;
  history: DayStats[]; // last 14 days
}

export interface TimerState {
  status: TimerStatus;
  workEndsAt: number | null;
  breakEndsAt: number | null;
  pausedRemainingMs: number | null;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 20,
  breakSeconds: 20,
  snoozeMinutes: 5,
  idleThresholdMinutes: 3,
  soundEnabled: true,
  notificationsEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  autoStart: true,
};

export const DEFAULT_TIMER_STATE: TimerState = {
  status: "paused",
  workEndsAt: null,
  breakEndsAt: null,
  pausedRemainingMs: null,
  updatedAt: Date.now(),
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyDayStats(date = todayKey()): DayStats {
  return { date, completed: 0, skipped: 0, snoozed: 0 };
}

export const DEFAULT_STATS: Stats = {
  today: emptyDayStats(),
  streak: 0,
  lastActiveDate: null,
  history: [],
};

export type Message =
  | { type: "GET_STATE" }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "SNOOZE" }
  | { type: "SKIP_BREAK" }
  | { type: "COMPLETE_BREAK" }
  | { type: "TAKE_BREAK_NOW" }
  | { type: "OPEN_BREAK" }
  | { type: "SETTINGS_UPDATED"; settings: Settings }
  | { type: "STATE"; payload: { settings: Settings; timer: TimerState; stats: Stats } };
