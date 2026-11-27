import { createEffect, createRoot, createSignal, on, untrack } from "solid-js";
import { listenEventSub, unlistenAll } from "../../platform/listen.ts";
import type {
  RawStreamOffline,
  RawStreamOnline,
} from "../../platform/twitch/eventsubPayloads.ts";
import { getStreamsFromIds } from "../../platform/twitch/streams.ts";
import { user } from "../users/index.ts";
import { streamForUserId } from "./streams.ts";
import { load as loadFollowers } from "./followers.ts";
import { type ViewerSeries, withReading } from "./viewerSeries.ts";

const [ownLive, setOwnLive] = createSignal(false);
export { ownLive };

const [ownViewers, setOwnViewers] = createSignal<ViewerSeries | null>(null);
export { ownViewers };

function recordViewers(id: string | undefined) {
  const stream = id ? streamForUserId(id) : undefined;
  if (!id || !stream) return setOwnViewers(null);
  const before = untrack(() => ownViewers()?.streamId);
  setOwnViewers((series) =>
    withReading(series, stream.id, stream.viewerCount, Date.now()),
  );
  if (before !== stream.id) void noteFollowersAtStart(id, stream.id);
}

async function noteFollowersAtStart(id: string, streamId: string) {
  const count = await loadFollowers(id);
  const series = ownViewers();
  if (count === null || series?.streamId !== streamId) return;
  if (series.followersAtStart !== null) return;
  setOwnViewers({ ...series, followersAtStart: count });
}

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
    createEffect(() => recordViewers(user()?.id));
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
    setOwnViewers(null);
  };
}
