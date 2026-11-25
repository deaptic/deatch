import { createEffect, createResource, createRoot } from "solid-js";
import type { PublishParams } from "../../shared/types/index.ts";
import { widgetsPublish, widgetsRetain } from "../../platform/widgets.ts";
import {
  channelEmoteChanges,
  cheermotes,
  emoteMapFor,
} from "../emotes/index.ts";
import { badgeMapFor } from "../badges/index.ts";
import { type FeedEntry, feeds } from "../feed/index.ts";
import { isBlocked } from "../blocks/index.ts";
import { savedWidgets } from "../preferences/index.ts";
import { knownUser, user, users } from "../users/index.ts";
import type { User } from "../../shared/types/index.ts";
import type { Frame } from "./frames.ts";
import { chatterIds, streamEntries } from "./model.ts";

const FLUSH_MS = 100;

const notBlocked = (entry: FeedEntry) =>
  entry.kind !== "message" || !isBlocked(entry.chatter_user_id);

function pictured(ids: string[]): User[] {
  users.get(ids).catch(() => {});
  return ids.map(knownUser).filter((u): u is User => !!u);
}

export function start(): () => void {
  const pending = new Map<string, PublishParams>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  function flush() {
    timer = undefined;
    const live = new Set(savedWidgets().map((w) => w.id));
    for (const params of pending.values()) {
      if (!live.has(params.widget)) continue;
      widgetsPublish(params, { silent: true }).catch(() => {});
    }
    pending.clear();
  }

  function publish(widget: string, frame: Frame) {
    pending.set(`${widget}:${frame.topic}`, {
      widget,
      topic: frame.topic,
      frame: JSON.stringify(frame),
    });
    timer ??= setTimeout(flush, FLUSH_MS);
  }

  const publishAll = (frame: () => Frame) => {
    const widgets = savedWidgets();
    if (widgets.length === 0) return;
    const shared = frame();
    for (const w of widgets) publish(w.id, shared);
  };

  const dispose = createRoot((dispose) => {
    const ownChannel = () => {
      const own = user();
      return own ? { id: own.id, login: own.login } : false;
    };
    const [ownEmotes] = createResource(() => {
      const channel = ownChannel();
      return channel && { ...channel, changes: channelEmoteChanges() };
    }, emoteMapFor);
    const [ownBadges] = createResource(ownChannel, badgeMapFor);
    const [ownColor] = createResource(() => user()?.id, users.chatColor);
    const me = () => {
      const own = user();
      return own ? { user: own, color: ownColor() ?? "" } : null;
    };
    createEffect(() => {
      const widgets = savedWidgets().map((w) => w.id);
      widgetsRetain({ widgets }, { silent: true }).catch(() => {});
    });
    createEffect(() => {
      for (const w of savedWidgets()) {
        publish(w.id, { topic: "style", style: w.style });
      }
    });
    createEffect(() => {
      const own = user()?.id;
      publishAll(() => ({
        topic: "assets",
        emotes: ownEmotes() ?? {},
        cheermotes: own ? cheermotes.forChannel(own) : {},
        badges: ownBadges() ?? {},
        me: me(),
      }));
    });
    createEffect(() => {
      const own = user()?.id;
      const visible = (own && feeds[own]?.messages.filter(notBlocked)) || [];
      for (const w of savedWidgets()) {
        const shown = streamEntries(visible, w.style);
        publish(w.id, {
          topic: "entries",
          entries: shown,
          users: w.style.showAvatars ? pictured(chatterIds(shown)) : [],
        });
      }
    });
    return dispose;
  });

  return () => {
    clearTimeout(timer);
    dispose();
  };
}
