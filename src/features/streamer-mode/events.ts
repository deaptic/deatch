import { createEffect, createRoot, on } from "solid-js";
import { streamerAuto, streamerMode } from "../preferences/index.ts";
import { ownLive } from "../channels/index.ts";
import * as streamer from "./store.ts";

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(
        ownLive,
        (live, wasLive) => {
          if (live && streamerAuto()) streamer.streamStarted();
          else if (!live && wasLive) streamer.streamEnded();
        },
        { defer: true },
      ),
    );
    createEffect(
      on(streamerMode, (on) => {
        if (on) streamer.turnedOn();
      }),
    );
    return dispose;
  });
}
