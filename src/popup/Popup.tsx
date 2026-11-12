import { useEffect, useState } from "react";
import { fetchState, sendMessage } from "../lib/messaging";
import { adherencePercent, formatCountdown } from "../lib/time";
import type { Settings, Stats, TimerState } from "../lib/types";

export function Popup() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const state = await fetchState();
      setSettings(state.settings);
      setTimer(state.timer);
      setStats(state.stats);
      setError(null);
    } catch {
      setError("Could not reach Respite. Try reloading the extension.");
    }
  }

  useEffect(() => {
    void refresh();
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    const sync = window.setInterval(() => void refresh(), 2000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(sync);
    };
  }, []);

  if (error) {
    return (
      <div className="w-[320px] bg-foam p-5 text-ink">
        <p className="text-sm text-coral">{error}</p>
      </div>
    );
  }

  if (!settings || !timer || !stats) {
    return (
      <div className="flex w-[320px] items-center justify-center bg-foam p-8 text-ink-soft">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  const remainingMs =
    timer.status === "running" && timer.workEndsAt
      ? timer.workEndsAt - now
      : timer.status === "break" && timer.breakEndsAt
        ? timer.breakEndsAt - now
        : timer.pausedRemainingMs ?? 0;

  const statusLabel =
    timer.status === "running"
      ? "Next break in"
      : timer.status === "break"
        ? "Break in progress"
        : timer.status === "idle"
          ? "Paused — you're away"
          : "Paused";

  const adherence = adherencePercent(stats.today.completed, stats.today.skipped);

  async function act(
    type:
      | "PAUSE"
      | "RESUME"
      | "START"
      | "TAKE_BREAK_NOW"
      | "SNOOZE"
      | "SKIP_BREAK",
  ) {
    const res = (await sendMessage({ type })) as {
      type: "STATE";
      payload: { settings: Settings; timer: TimerState; stats: Stats };
    };
    setSettings(res.payload.settings);
    setTimer(res.payload.timer);
    setStats(res.payload.stats);
  }

  return (
    <div className="w-[320px] overflow-hidden bg-[linear-gradient(165deg,#eef5f3_0%,#f7faf9_45%,#e8f0f4_100%)] text-ink">
      <div className="relative px-5 pb-4 pt-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(61,126,166,0.22),transparent_70%)] animate-breathe"
        />
        <p className="font-display text-[1.65rem] leading-none tracking-tight text-pine-deep">
          Respite
        </p>
        <p className="mt-1 text-xs text-ink-soft">A quiet companion for screen days</p>
      </div>

      <div className="mx-5 mb-4 rounded-2xl bg-white/70 px-4 py-4 shadow-[0_1px_0_rgba(26,43,40,0.04)] backdrop-blur">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          {statusLabel}
        </p>
        <p className="mt-1 font-display text-4xl tabular-nums tracking-tight text-ink">
          {timer.status === "paused" && !timer.pausedRemainingMs
            ? "— —"
            : formatCountdown(remainingMs)}
        </p>
        <p className="mt-2 text-xs text-ink-soft">
          {settings.workMinutes} min work · {settings.breakSeconds}s break
        </p>
      </div>

      <div className="mx-5 mb-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Done" value={String(stats.today.completed)} />
        <Stat label="Skipped" value={String(stats.today.skipped)} />
        <Stat label="Today" value={`${adherence}%`} />
      </div>

      <div className="flex flex-col gap-2 px-5 pb-5">
        {timer.status === "running" && (
          <>
            <button
              className="rounded-xl bg-pine px-3 py-2.5 text-sm font-medium text-white transition hover:bg-pine-deep"
              onClick={() => void act("TAKE_BREAK_NOW")}
            >
              Take a break now
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="rounded-xl border border-ink/10 bg-white/60 px-3 py-2 text-sm font-medium text-ink transition hover:bg-white"
                onClick={() => void act("PAUSE")}
              >
                Pause
              </button>
              <button
                className="rounded-xl border border-ink/10 bg-white/60 px-3 py-2 text-sm font-medium text-ink transition hover:bg-white"
                onClick={() => void act("SNOOZE")}
              >
                Snooze {settings.snoozeMinutes}m
              </button>
            </div>
          </>
        )}

        {(timer.status === "paused" || timer.status === "idle") && (
          <button
            className="rounded-xl bg-pine px-3 py-2.5 text-sm font-medium text-white transition hover:bg-pine-deep"
            onClick={() => void act(timer.pausedRemainingMs ? "RESUME" : "START")}
          >
            {timer.pausedRemainingMs ? "Resume" : "Start"}
          </button>
        )}

        {timer.status === "break" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              className="rounded-xl bg-lagoon px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              onClick={() => void sendMessage({ type: "OPEN_BREAK" })}
            >
              Open break
            </button>
            <button
              className="rounded-xl border border-ink/10 bg-white/60 px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-white"
              onClick={() => void act("SKIP_BREAK")}
            >
              Skip
            </button>
          </div>
        )}

        <button
          className="mt-1 text-center text-xs font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline"
          onClick={() => void chrome.runtime.openOptionsPage()}
        >
          Settings &amp; history
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/55 px-2 py-2.5">
      <p className="font-display text-lg leading-none text-ink">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-ink-soft">{label}</p>
    </div>
  );
}
