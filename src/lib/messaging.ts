import type { Message, Settings, Stats, TimerState } from "./types";

export async function sendMessage<T = unknown>(message: Message): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

export async function fetchState(): Promise<{
  settings: Settings;
  timer: TimerState;
  stats: Stats;
}> {
  const res = (await sendMessage({ type: "GET_STATE" })) as {
    type: "STATE";
    payload: { settings: Settings; timer: TimerState; stats: Stats };
  };
  return res.payload;
}
