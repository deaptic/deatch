import { log } from "../../shared/log.ts";
import { asRecord, stringOrNull } from "../../shared/record.ts";
import {
  attributeOf,
  emit,
  EVENTS,
  isOn,
  listen,
  type PageKey,
  readPage,
  readRedeemAsk,
  type RedeemAsk,
  writePage,
} from "../../shared/protocol.ts";
import type { ChannelReport } from "../types.ts";
import { createBonus, hasOffer } from "./bonus.ts";
import type { Life } from "../../shared/life.ts";
import { createChannelIds } from "./channel.ts";
import { createDrops, isDropEarned } from "./drops.ts";
import { readWatchEarned } from "./earning.ts";
import { createFinder } from "./finder.ts";
import { createProgress, readProgressEvent } from "./progress.ts";
import { createPubsub } from "./pubsub.ts";
import { fiberRoot, type FiberRoot } from "../../shared/react.ts";
import { redeem } from "./redeem.ts";
import { snapshot } from "./snapshot.ts";
import type { TwitchPoints } from "./twitch.ts";

const WATCHED: PageKey[] = ["channel", "autoClaim", "autoDrops"];

export function startRewardsPage(life: Life) {
  const finder = createFinder();
  const bonus = createBonus(() => life.current() && isOn("autoClaim"));
  const drops = createDrops(finder, () => life.current() && isOn("autoDrops"));
  const pubsub = createPubsub(life);
  const progress = createProgress(finder, () => {
    stale = true;
    update();
  });
  const earnedAt: Record<string, string> = {};
  let stale = false;
  let watchedChannelID: string | null = null;
  let followedLogin: string | null = null;
  let finishedDrop: string | null = null;
  const channelIds = createChannelIds(finder);
  let reported: string | null = null;
  let lastPoints: TwitchPoints | null = null;
  let lastClaimable = false;
  let lastSubscribed: boolean | null = null;
  let lastChannel: string | null = null;
  let redeeming = false;

  function report(next: ChannelReport | null) {
    const text = next ? JSON.stringify(next) : null;
    if (text === reported) return;
    reported = text;
    writePage("report", text);
  }

  function forgetPoints() {
    lastPoints = null;
    report(null);
  }

  function updatePoints(root: FiberRoot) {
    const channel = readPage("channel");
    if (channel !== lastChannel) {
      lastChannel = channel;
      stale = true;
      finder.hurry();
    }
    if (!channel) return forgetPoints();
    const missing =
      !finder.points(root) ||
      !finder.button() ||
      !finder.client() ||
      finder.subscribed(root) === null;
    if (missing) finder.rescan(root);
    const button = finder.button();
    const claimable = button !== null && hasOffer(button);
    const points = finder.points(root);
    const subscribed = finder.subscribed(root);
    const changed =
      stale ||
      points !== lastPoints ||
      claimable !== lastClaimable ||
      subscribed !== lastSubscribed;
    if (changed) {
      stale = false;
      lastPoints = points;
      lastClaimable = claimable;
      lastSubscribed = subscribed;
      const viewing = {
        bonusReady: claimable,
        subscribed,
        drop: progress.current(),
        earnedAt: { ...earnedAt },
      };
      report(snapshot(channel, points, viewing));
    }
    if (button && claimable) bonus.claimSoon(button);
  }

  function watchDrops(channelID: string) {
    watchedChannelID = channelID;
    void progress.refresh(channelID);
  }

  function followChannel(root: FiberRoot) {
    const login = readPage("channel");
    if (login === followedLogin || !finder.client()) return;
    followedLogin = login;
    watchedChannelID = null;
    if (!login) return;
    const points = finder.points(root);
    if (points?.channelLogin.toLowerCase() === login) {
      return watchDrops(points.channelID);
    }
    void channelIds.idOf(login).then((id) => {
      if (id && followedLogin === login) watchDrops(id);
    });
  }

  function update() {
    try {
      const root = fiberRoot();
      if (!root) return forgetPoints();
      pubsub.attach();
      updatePoints(root);
      followChannel(root);
      drops.update(root);
    } catch (error) {
      log.error("channel points check failed", error);
    }
  }

  async function answerRedeem(ask: RedeemAsk) {
    const answer = (error: string | null) =>
      emit(EVENTS.redeemed, { request: ask.request, error });
    if (redeeming) return answer("BUSY");
    redeeming = true;
    try {
      const root = fiberRoot();
      answer(await redeem(finder.client(), root && finder.points(root), ask));
    } catch (error) {
      log.error("redeem failed", error);
      answer("FAILED");
    } finally {
      redeeming = false;
    }
  }

  function claimNow() {
    const button = finder.button();
    if (button && hasOffer(button)) button.onClick();
  }

  function refreshProgress() {
    if (watchedChannelID) void progress.refresh(watchedChannelID);
  }

  function claimThenRefresh() {
    const claimed = isOn("autoDrops") ? drops.claimEarned() : Promise.resolve();
    void claimed.then(refreshProgress);
  }

  pubsub.on("create-notification", (message) => {
    if (isDropEarned(message)) claimThenRefresh();
  });
  pubsub.on("drop-claim", refreshProgress);
  pubsub.on("points-earned", (message) => {
    const earned = readWatchEarned(message);
    if (!earned) return;
    earnedAt[earned.channelID] = earned.at;
    stale = true;
    update();
  });
  pubsub.on("drop-progress", (message) => {
    const minutes = readProgressEvent(message);
    if (!minutes) return;
    progress.advance(minutes);
    const finished = `${minutes.channelID}:${minutes.dropID ?? ""}`;
    if (minutes.watched >= minutes.required && finished !== finishedDrop) {
      finishedDrop = finished;
      claimThenRefresh();
    }
  });

  listen(life, EVENTS.redeem, (detail) => {
    const ask = readRedeemAsk(detail);
    if (ask) void answerRedeem(ask);
  });
  listen(life, EVENTS.claimBonus, claimNow);
  listen(life, EVENTS.claimDrops, (detail) => {
    const request = stringOrNull(asRecord(detail).request);
    if (!request) return;
    void drops.claimEarned(true).then((error) => {
      emit(EVENTS.dropsClaimed, { request, error });
      refreshProgress();
    });
  });

  life.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true,
      characterData: true,
      attributeFilter: WATCHED.map(attributeOf),
    },
    update,
  );
  update();
}
