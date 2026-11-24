import { createEffect, createRoot, createSignal, on } from "solid-js";
import { listenEventSub, unlistenAll } from "../../platform/listen.ts";
import type {
  RawStreamOffline,
  RawStreamOnline,
} from "../../platform/twitch/eventsubPayloads.ts";
import { getStreamsFromIds } from "../../platform/twitch/streams.ts";
import { user } from "../users/index.ts";

const [ownLive, setOwnLive] = createSignal(false);
export { ownLive };

const isOwn = (broadcasterId: string) => broadcasterId === user()?.id;

export function start(): () => void {
  const dispose = createRoot((dispose) => {
    createEffect(
      on(
        () => user()?.id,
        (id) => {
          setOwnLive(false);
          if (!id) return;
          getStreamsFromIds({ userIds: [id] }, { silent: true })
            .then((streams) => {
              if (user()?.id === id) setOwnLive(streams.length > 0);
            })
            .catch(() => {});
        },
      ),
    );
    return dispose;
  });
  const stop = unlistenAll([
    listenEventSub<RawStreamOnline>("stream.online", (e) => {
      if (isOwn(e.event.broadcaster_user_id)) setOwnLive(true);
    }),
    listenEventSub<RawStreamOffline>("stream.offline", (e) => {
      if (isOwn(e.event.broadcaster_user_id)) setOwnLive(false);
    }),
  ]);
  return () => {
    dispose();
    stop();
    setOwnLive(false);
  };
}
