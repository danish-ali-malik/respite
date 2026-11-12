import { useEffect, useMemo, useRef, useState } from "react";
import { fetchState, sendMessage } from "../lib/messaging";
import { formatSeconds } from "../lib/time";
import type { Settings, TimerState } from "../lib/types";

export function BreakScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const audioPlayed = useRef(false);

  useEffect(() => {
    void fetchState().then((s) => {
      setSettings(s.settings);
      setTimer(s.timer);
    });
    const tick = window.setInterval(() => setNow(Date.now()), 100);
    const sync = window.setInterval(() => {
      void fetchState().then((s) => {
        setSettings(s.settings);
        setTimer(s.timer);
      });
    }, 1000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(sync);
    };
  }, []);

  const remainingSec = useMemo(() => {
    if (!timer?.breakEndsAt) return settings?.breakSeconds ?? 20;
    return Math.max(0, Math.ceil((timer.breakEndsAt - now) / 1000));
  }, [timer, now, settings]);

  const total = settings?.breakSeconds ?? 20;
  const progress = Math.min(1, Math.max(0, 1 - remainingSec / total));

  useEffect(() => {
    if (!settings?.soundEnabled || audioPlayed.current) return;
    audioPlayed.current = true;
    playSoftChime();
  }, [settings]);

  useEffect(() => {
    if (remainingSec > 0 || completedRef.current || !timer) return;
    if (timer.status !== "break") return;
    completedRef.current = true;
    setDone(true);
    void sendMessage({ type: "COMPLETE_BREAK" }).then(() => {
      window.setTimeout(() => window.close(), 1600);
    });
  }, [remainingSec, timer]);

  async function skip() {
    completedRef.current = true;
    await sendMessage({ type: "SKIP_BREAK" });
    window.close();
  }

  async function snooze() {
    completedRef.current = true;
    await sendMessage({ type: "SNOOZE" });
    window.close();
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-ink">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(160deg,#0f2a28_0%,#1a4540_38%,#2a5f6e_72%,#3d6f88_100%)]"
      />
      <div
        aria-hidden
        className="animate-drift absolute -left-[10%] top-[8%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(180,220,210,0.28),transparent_68%)]"
      />
      <div
        aria-hidden
        className="animate-drift absolute -right-[8%] bottom-[5%] h-[48vmax] w-[48vmax] rounded-full bg-[radial-gradient(circle,rgba(140,190,220,0.22),transparent_70%)]"
        style={{ animationDelay: "-7s" }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(15,30,35,0.45),transparent)]"
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center text-white">
        <p className="animate-rise font-display text-sm tracking-[0.22em] text-white/70 uppercase">
          Respite
        </p>

        <h1
          className="animate-rise mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl"
          style={{ animationDelay: "80ms" }}
        >
          {done ? "Nice. Back when you're ready." : "Look into the distance"}
        </h1>

        <p
          className="animate-rise mt-4 max-w-md text-base text-white/80 sm:text-lg"
          style={{ animationDelay: "140ms" }}
        >
          Soften your gaze on something about 20 feet (6 metres) away. Blink
          naturally. This is a short pause — not a test.
        </p>

        <div
          className="animate-rise relative mt-12 flex h-44 w-44 items-center justify-center"
          style={{ animationDelay: "200ms" }}
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(232,244,240,0.95)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
              className="transition-[stroke-dashoffset] duration-100 ease-linear"
            />
          </svg>
          <div className="animate-breathe absolute inset-6 rounded-full bg-white/10" />
          <p className="relative font-display text-5xl tabular-nums tracking-tight">
            {done ? "✓" : formatSeconds(remainingSec)}
          </p>
        </div>

        {!done && (
          <div
            className="animate-rise mt-12 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "260ms" }}
          >
            <button
              className="rounded-full bg-white/95 px-5 py-2.5 text-sm font-medium text-pine-deep transition hover:bg-white"
              onClick={() => void skip()}
            >
              Skip this one
            </button>
            <button
              className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
              onClick={() => void snooze()}
            >
              Snooze
            </button>
          </div>
        )}

        <p className="mt-10 max-w-sm text-xs leading-relaxed text-white/55">
          Respite is a wellness habit tool — not a medical device. It does not
          diagnose, treat, or prevent eye disease.
        </p>
      </main>
    </div>
  );
}

function playSoftChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.04 + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9 + i * 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + 1.1 + i * 0.12);
    });
    window.setTimeout(() => void ctx.close(), 2000);
  } catch {
    // Audio may be blocked; ignore.
  }
}
