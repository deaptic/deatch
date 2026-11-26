import type { Life } from "../shared/life.ts";
import { log } from "../shared/log.ts";
import { isOn, writePage } from "../shared/protocol.ts";
import { asRecord } from "../shared/record.ts";
import { fiberRoot, searchTree } from "../shared/react.ts";
import { readStats } from "./player-stats.ts";

const READ_GAP_MS = 1000;

type MediaPlayer = Record<string, unknown> & { getLiveLatency: () => unknown };

function ask(player: MediaPlayer | null, method: string): unknown {
  const fn = player?.[method];
  return typeof fn === "function" ? (fn as () => unknown).call(player) : null;
}

function mediaPlayerOf(props: unknown): MediaPlayer | null {
  const instance = asRecord(asRecord(props).mediaPlayerInstance);
  const player = asRecord(instance.playerInstance ?? instance);
  return typeof player.getLiveLatency === "function"
    ? (player as MediaPlayer)
    : null;
}

export function startPlayerStats(life: Life) {
  let player: MediaPlayer | null = null;
  let readAt = -Infinity;
  const watched = new WeakSet<HTMLVideoElement>();

  function findPlayer(): MediaPlayer | null {
    const root = fiberRoot();
    if (!root) return null;
    return searchTree(root.current, {
      player: (fiber) => mediaPlayerOf(fiber.memoizedProps),
    }).player;
  }

  function read() {
    if (!isOn("playerStats")) return writePage("stats", null);
    if (performance.now() - readAt < READ_GAP_MS) return;
    readAt = performance.now();
    player ??= findPlayer();
    try {
      const stats = readStats({
        latency: ask(player, "getLiveLatency"),
        buffer: ask(player, "getBufferDuration"),
        width: ask(player, "getVideoWidth"),
        height: ask(player, "getVideoHeight"),
        fps: ask(player, "getVideoFrameRate"),
        bitrate: ask(player, "getVideoBitRate"),
        dropped: ask(player, "getDroppedFrames"),
        rate: ask(player, "getPlaybackRate"),
      });
      writePage("stats", stats ? JSON.stringify(stats) : null);
    } catch (error) {
      player = null;
      log.warn("player stats not read", error);
    }
  }

  function watchVideos() {
    for (const video of document.querySelectorAll("video")) {
      if (watched.has(video)) continue;
      watched.add(video);
      life.listen(video, "timeupdate", read);
      life.listen(video, "emptied", () => {
        player = null;
        writePage("stats", null);
      });
    }
  }

  watchVideos();
  life.observe(
    document.documentElement,
    { childList: true, subtree: true },
    watchVideos,
  );
}
