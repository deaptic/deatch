import { events } from "../bindings.ts";
import { seventvGetChannelEmotes } from "../api/external/seventv.ts";
import {
  seventvSubscribeEmoteSet,
  seventvUnsubscribeEmoteSet,
} from "../api/external/seventv_events.ts";
import {
  applyEmoteSetUpdate,
  describeEmoteSetUpdate,
  emoteSetActor,
} from "../services/emoteSetUpdate.ts";
import { setSevenTvChannel } from "../stores/emotes.ts";
import { appendItem } from "../stores/feeds.ts";
import type { EmoteEntry, EmoteSetUpdated } from "../types/index.ts";
import type { FeedEvent } from "../types/feed.ts";

type Entry = { broadcasterId: string; setId: string; emotes: EmoteEntry[] };

export class SevenTvManager {
  private byBroadcaster = new Map<string, Entry>();
  private bySetId = new Map<string, Entry>();
  private activeChannelId: string | null = null;

  constructor() {
    void events.emoteSetUpdated.listen((e) => this.onUpdate(e.payload));
  }

  public async subscribe(broadcasterId: string): Promise<void> {
    if (this.byBroadcaster.has(broadcasterId)) return;
    const r = await seventvGetChannelEmotes({ channelId: broadcasterId }, {
      silent: true,
    })
      .catch(() => null);
    if (!r?.emote_set_id) return;
    const entry: Entry = {
      broadcasterId,
      setId: r.emote_set_id,
      emotes: r.emotes,
    };
    this.byBroadcaster.set(broadcasterId, entry);
    this.bySetId.set(entry.setId, entry);
    this.pushIfActive(entry);
    void seventvSubscribeEmoteSet({ emoteSetId: entry.setId }, { silent: true })
      .catch(() => {});
  }

  public async unsubscribe(broadcasterId: string): Promise<void> {
    const entry = this.byBroadcaster.get(broadcasterId);
    if (!entry) return;
    this.byBroadcaster.delete(broadcasterId);
    this.bySetId.delete(entry.setId);
    if (broadcasterId === this.activeChannelId) setSevenTvChannel([]);
    void seventvUnsubscribeEmoteSet({ emoteSetId: entry.setId }, {
      silent: true,
    }).catch(() => {});
  }

  public setActive(broadcasterId: string | null): void {
    this.activeChannelId = broadcasterId;
    setSevenTvChannel(
      broadcasterId ? this.byBroadcaster.get(broadcasterId)?.emotes ?? [] : [],
    );
  }

  private onUpdate(u: EmoteSetUpdated): void {
    const entry = this.bySetId.get(u.id);
    if (!entry) return;
    entry.emotes = applyEmoteSetUpdate(entry.emotes, u);
    this.pushIfActive(entry);
    this.announce(entry.broadcasterId, u);
  }

  private pushIfActive(entry: Entry): void {
    if (entry.broadcasterId === this.activeChannelId) {
      setSevenTvChannel(entry.emotes);
    }
  }

  private announce(channelId: string, u: EmoteSetUpdated): void {
    const who = emoteSetActor(u);
    const ts = Date.now();
    for (const message of describeEmoteSetUpdate(u)) {
      appendItem(channelId, this.event(ts, who, message));
    }
  }
  private event(timestamp: number, actor: string, message: string): FeedEvent {
    return {
      kind: "event",
      id: crypto.randomUUID(),
      notice_type: "seventv_update",
      system_message: message,
      chatter_name: actor,
      color: "",
      timestamp,
    };
  }
}

export const sevenTvManager = new SevenTvManager();
