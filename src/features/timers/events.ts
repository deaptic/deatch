import { createEffect, createRoot, on } from "solid-js";
import { listenEventSub, unlistenAll } from "../../platform/listen.ts";
import type { RawChatMessage } from "../../platform/twitch/eventsubPayloads.ts";
import { savedTimers } from "../preferences/index.ts";
import { ownLive } from "../channels/index.ts";
import { user } from "../users/index.ts";
import { chat } from "../chat/index.ts";
import { isDue, type TimerRun } from "./model.ts";

const TICK_MS = 30_000;

export function start(): () => void {
  const runs = new Map<string, TimerRun>();
  let posting = false;

  const runOf = (id: string, now: number) => {
    let run = runs.get(id);
    if (!run) {
      run = { lastPostedAt: now, messagesSince: 0 };
      runs.set(id, run);
    }
    return run;
  };

  async function tick() {
    const own = user()?.id;
    if (!own || !ownLive() || posting) return;
    const now = Date.now();
    const enabled = savedTimers().filter((t) => t.enabled);
    for (const id of runs.keys()) {
      if (!enabled.some((t) => t.id === id)) runs.delete(id);
    }
    const due = enabled
      .filter((t) => isDue(t, runOf(t.id, now), now))
      .toSorted(
        (a, b) => runOf(a.id, now).lastPostedAt - runOf(b.id, now).lastPostedAt,
      );
    const next = due[0];
    if (!next) return;
    posting = true;
    const outcome = await chat.send(
      { broadcasterId: own, message: next.message, replyParentMessageId: null },
      { silent: true },
    );
    posting = false;
    if (outcome === "sent") {
      for (const run of runs.values()) run.messagesSince = 0;
      runs.set(next.id, { lastPostedAt: Date.now(), messagesSince: 0 });
    }
  }

  const dispose = createRoot((dispose) => {
    createEffect(on(ownLive, () => runs.clear()));
    return dispose;
  });
  const stop = unlistenAll([
    listenEventSub<RawChatMessage>("channel.chat.message", (e) => {
      const own = user()?.id;
      const raw = e.event;
      if (raw.broadcaster_user_id !== own || raw.chatter_user_id === own)
        return;
      for (const run of runs.values()) run.messagesSince++;
    }),
  ]);
  const timer = setInterval(() => void tick(), TICK_MS);
  return () => {
    clearInterval(timer);
    dispose();
    stop();
  };
}
