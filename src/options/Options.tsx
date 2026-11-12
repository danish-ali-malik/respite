import { useEffect, useState } from "react";
import { fetchState, sendMessage } from "../lib/messaging";
import { adherencePercent } from "../lib/time";
import type { Settings, Stats } from "../lib/types";

export function Options() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchState()
      .then((s) => {
        setSettings(s.settings);
        setStats(s.stats);
      })
      .catch(() => setError("Could not load settings."));
  }, []);

  async function save(next: Settings) {
    setSettings(next);
    const res = (await sendMessage({
      type: "SETTINGS_UPDATED",
      settings: next,
    })) as { payload: { settings: Settings; stats: Stats } };
    setSettings(res.payload.settings);
    setStats(res.payload.stats);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-coral">{error}</p>
      </div>
    );
  }

  if (!settings || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft">
        Loading…
      </div>
    );
  }

  const adherence = adherencePercent(stats.today.completed, stats.today.skipped);
  const history = [...stats.history, stats.today].slice(-7);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4f2_0%,#f7faf9_40%,#e9f1f5_100%)] text-ink">
      <header className="mx-auto max-w-2xl px-6 pb-2 pt-12">
        <p className="font-display text-4xl tracking-tight text-pine-deep">Respite</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
          Configure a gentle 20-20-20 rhythm. Everything stays on your device —
          no accounts, no cloud sync of health data.
        </p>
      </header>

      <main className="mx-auto grid max-w-2xl gap-6 px-6 py-8">
        <section className="rounded-3xl bg-white/75 p-6 shadow-[0_1px_0_rgba(26,43,40,0.05)] backdrop-blur">
          <h2 className="font-display text-xl">Today</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Completed" value={String(stats.today.completed)} />
            <Metric label="Skipped" value={String(stats.today.skipped)} />
            <Metric label="Adherence" value={`${adherence}%`} />
            <Metric label="Streak" value={`${stats.streak}d`} />
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
              Last 7 days
            </p>
            <div className="mt-3 flex items-end gap-2">
              {history.map((day) => {
                const height = Math.max(8, Math.min(64, day.completed * 10 + 8));
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-pine/80"
                      style={{ height }}
                      title={`${day.date}: ${day.completed} completed`}
                    />
                    <span className="text-[10px] text-ink-soft">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white/75 p-6 shadow-[0_1px_0_rgba(26,43,40,0.05)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">Reminders</h2>
            {saved && <span className="text-xs font-medium text-pine">Saved</span>}
          </div>

          <div className="mt-5 grid gap-5">
            <NumberField
              label="Work interval (minutes)"
              value={settings.workMinutes}
              min={5}
              max={60}
              onChange={(workMinutes) => void save({ ...settings, workMinutes })}
            />
            <NumberField
              label="Break length (seconds)"
              value={settings.breakSeconds}
              min={10}
              max={120}
              onChange={(breakSeconds) => void save({ ...settings, breakSeconds })}
            />
            <NumberField
              label="Snooze (minutes)"
              value={settings.snoozeMinutes}
              min={1}
              max={30}
              onChange={(snoozeMinutes) => void save({ ...settings, snoozeMinutes })}
            />
            <NumberField
              label="Idle pause after (minutes)"
              hint="If you're away longer than this, Respite starts a fresh cycle when you return."
              value={settings.idleThresholdMinutes}
              min={1}
              max={30}
              onChange={(idleThresholdMinutes) =>
                void save({ ...settings, idleThresholdMinutes })
              }
            />

            <Toggle
              label="Desktop notifications"
              checked={settings.notificationsEnabled}
              onChange={(notificationsEnabled) =>
                void save({ ...settings, notificationsEnabled })
              }
            />
            <Toggle
              label="Soft chime on break"
              checked={settings.soundEnabled}
              onChange={(soundEnabled) => void save({ ...settings, soundEnabled })}
            />
            <Toggle
              label="Start when browser launches"
              checked={settings.autoStart}
              onChange={(autoStart) => void save({ ...settings, autoStart })}
            />
            <Toggle
              label="Quiet hours"
              checked={settings.quietHoursEnabled}
              onChange={(quietHoursEnabled) =>
                void save({ ...settings, quietHoursEnabled })
              }
            />

            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <TimeField
                  label="From"
                  value={settings.quietHoursStart}
                  onChange={(quietHoursStart) =>
                    void save({ ...settings, quietHoursStart })
                  }
                />
                <TimeField
                  label="Until"
                  value={settings.quietHoursEnd}
                  onChange={(quietHoursEnd) =>
                    void save({ ...settings, quietHoursEnd })
                  }
                />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-ink/8 bg-white/55 p-6 text-sm leading-relaxed text-ink-soft">
          <h2 className="font-display text-lg text-ink">Wellness, not medicine</h2>
          <p className="mt-2">
            Respite helps you practice the 20-20-20 habit recommended by many eye
            care professionals to ease temporary digital eye strain. It does not
            claim to prevent or treat eye disease, improve refractive error, or
            replace professional care.
          </p>
          <p className="mt-3">
            Privacy: settings and local habit stats stay in{" "}
            <code className="rounded bg-mist px-1 py-0.5 text-xs">chrome.storage.local</code>.
            No analytics, no accounts, no network requests.
          </p>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-mist/70 px-3 py-3">
      <p className="font-display text-2xl text-ink">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-ink-soft">{label}</p>
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      <input
        type="number"
        className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none ring-pine/30 focus:ring-2"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type="time"
        className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none ring-pine/30 focus:ring-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-pine" : "bg-ink/15"
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}
