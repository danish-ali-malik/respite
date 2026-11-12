import type { Settings } from "./types";

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Quiet hours wrap past midnight (e.g. 22:00–07:00). */
export function isInQuietHours(settings: Settings, now = new Date()): boolean {
  if (!settings.quietHoursEnabled) return false;

  const [sh, sm] = settings.quietHoursStart.split(":").map(Number);
  const [eh, em] = settings.quietHoursEnd.split(":").map(Number);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (start === end) return false;
  if (start < end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end;
}

export function adherencePercent(completed: number, skipped: number): number {
  const total = completed + skipped;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
