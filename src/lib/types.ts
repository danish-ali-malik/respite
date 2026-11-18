export type TimerStatus = "running" | "paused" | "break" | "stand" | "idle";

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
  /** Gentle stand-and-stretch nudges (separate from eye breaks). */
  standUpEnabled: boolean;
  /** Minutes between stand-up nudges (e.g. 30 or 60). */
  standUpMinutes: number;
  /** How long the stand-up screen stays open (seconds). */
  standUpSeconds: number;
}

export interface DayStats {
  date: string; // YYYY-MM-DD local
  completed: number;
  skipped: number;
  snoozed: number;
  stood: number;
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
  standUpEndsAt: number | null;
  standEndsAt: number | null;
  pausedRemainingMs: number | null;
  standPausedRemainingMs: number | null;
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
  standUpEnabled: true,
  standUpMinutes: 60,
  standUpSeconds: 45,
};

export const DEFAULT_TIMER_STATE: TimerState = {
  status: "paused",
  workEndsAt: null,
  breakEndsAt: null,
  standUpEndsAt: null,
  standEndsAt: null,
  pausedRemainingMs: null,
  standPausedRemainingMs: null,
  updatedAt: Date.now(),
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyDayStats(date = todayKey()): DayStats {
  return { date, completed: 0, skipped: 0, snoozed: 0, stood: 0 };
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
  | { type: "OPEN_STAND" }
  | { type: "SKIP_STAND" }
  | { type: "COMPLETE_STAND" }
  | { type: "SNOOZE_STAND" }
  | { type: "STAND_NOW" }
  | { type: "SETTINGS_UPDATED"; settings: Settings }
  | { type: "STATE"; payload: { settings: Settings; timer: TimerState; stats: Stats } };
