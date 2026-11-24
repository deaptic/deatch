import { createEffect, createRoot, on } from "solid-js";
import { listenEventSub, unlistenAll } from "../../platform/listen.ts";
import type {
  RawStreamOffline,
  RawStreamOnline,
} from "../../platform/twitch/eventsubPayloads.ts";
import { getStreamsFromIds } from "../../platform/twitch/streams.ts";
import { streamerAuto, streamerMode } from "../preferences/index.ts";
import { user } from "../users/index.ts";
import * as streamer from "./store.ts";

const isOwn = (broadcasterId: string) => broadcasterId === user()?.id;

function wentLive(): void {
  if (streamerAuto()) streamer.streamStarted();
}

export function start(): () => void {
  const dispose = createRoot((dispose) => {
    createEffect(
      on(
        () => user()?.id,
        (id) => {
          if (!id) return;
          getStreamsFromIds({ userIds: [id] }, { silent: true })
            .then((streams) => {
              if (streams.length > 0 && user()?.id === id) wentLive();
            })
            .catch(() => {});
        },
      ),
    );
    createEffect(
      on(streamerMode, (on) => {
        if (on) streamer.turnedOn();
      }),
    );
    return dispose;
  });
  const stop = unlistenAll([
    listenEventSub<RawStreamOnline>("stream.online", (e) => {
      if (isOwn(e.event.broadcaster_user_id)) wentLive();
    }),
    listenEventSub<RawStreamOffline>("stream.offline", (e) => {
      if (isOwn(e.event.broadcaster_user_id)) streamer.streamEnded();
    }),
  ]);
  return () => {
    dispose();
    stop();
  };
}
