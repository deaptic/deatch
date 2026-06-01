import { listen } from "@tauri-apps/api/event";
import { Manager } from "./Manager.ts";
import { seventvGetChannelEmotes } from "../api/external/seventv.ts";
import {
  seventvSubscribeEmoteSet,
  seventvUnsubscribeEmoteSet,
} from "../api/external/seventv_events.ts";
import { setSevenTvChannel } from "../stores/emotes.ts";
import { appendItem } from "../stores/feeds.ts";
import type { EmoteEntry } from "../types/external/emote.ts";
import type { Delta } from "../types/external/seventv.ts";
import type { FeedEvent } from "../types/feed.ts";

type Entry = { broadcasterId: string; setId: string; emotes: EmoteEntry[] };

export class SevenTvManager extends Manager {
  private byBroadcaster = new Map<string, Entry>();
  private bySetId = new Map<string, Entry>();
  private activeChannelId: string | null = null;

  constructor() {
    super();
    void listen<Delta>(
      "seventv-emote-set-updated",
      (e) => this.onDelta(e.payload),
    );
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

  private onDelta(u: Delta): void {
    const entry = this.bySetId.get(u.id);
    if (!entry) return;
    entry.emotes = this.applyDelta(entry.emotes, u);
    this.pushIfActive(entry);
    this.announce(entry.broadcasterId, u);
  }

  private pushIfActive(entry: Entry): void {
    if (entry.broadcasterId === this.activeChannelId) {
      setSevenTvChannel(entry.emotes);
    }
  }

  private applyDelta(prev: EmoteEntry[], u: Delta): EmoteEntry[] {
    const removed = new Set(u.removed);
    const renames = new Map(u.renamed.map((r) => [r.from, r.to]));
    const kept = prev.flatMap((e) =>
      removed.has(e.name)
        ? []
        : [renames.has(e.name) ? { ...e, name: renames.get(e.name)! } : e]
    );
    return [...kept, ...u.added];
  }

  private announce(channelId: string, u: Delta): void {
    const who = u.actor ?? "Someone";
    const lines = [
      ...u.added.map((e) => `${who} added 7TV emote ${e.name}`),
      ...u.removed.map((n) => `${who} removed 7TV emote ${n}`),
      ...u.renamed.map((r) => `${who} renamed 7TV emote ${r.from} to ${r.to}`),
    ];
    const ts = Date.now();
    for (const message of lines) {
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
