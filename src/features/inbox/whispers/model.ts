import type { UserRef, Whisper } from "../../../shared/types/index.ts";
import type { RawWhisper } from "../../../platform/twitch/eventsubPayloads.ts";
import type { FeedMessage } from "../../feed/index.ts";

export type Conversation = {
  peer: UserRef;
  last: Whisper | null;
  unread: number;
};

export function whisperFrom(
  raw: RawWhisper,
  timestamp: number,
  unread: boolean,
): Whisper {
  return {
    id: raw.whisper_id,
    peer: {
      id: raw.from_user_id,
      login: raw.from_user_login,
      displayName: raw.from_user_name,
    },
    outgoing: false,
    text: raw.whisper.text,
    timestamp,
    unread,
  };
}

export function conversationsOf(
  list: Whisper[],
  drafts: UserRef[],
): Conversation[] {
  const byPeer = new Map<string, Conversation & { last: Whisper }>();
  for (const w of list) {
    const prev = byPeer.get(w.peer.id);
    byPeer.set(w.peer.id, {
      peer: w.peer,
      last: w,
      unread: (prev?.unread ?? 0) + Number(w.unread),
    });
  }
  const started = [...byPeer.values()].sort(
    (a, b) => b.last.timestamp - a.last.timestamp,
  );
  const empty = drafts
    .filter((peer) => !byPeer.has(peer.id))
    .map((peer) => ({ peer, last: null, unread: 0 }));
  return [...empty, ...started];
}

export function threadWith(list: Whisper[], peerId: string): Whisper[] {
  return list.filter((w) => w.peer.id === peerId);
}

export function countUnread(list: Whisper[]): number {
  return list.filter((w) => w.unread).length;
}

export function feedMessageOf(
  whisper: Whisper,
  sender: UserRef,
  color: string,
): FeedMessage {
  return {
    kind: "message",
    message_id: whisper.id,
    chatter_user_id: sender.id,
    chatter_login: sender.login,
    chatter_name: sender.displayName,
    color,
    fragments: [{ type: "text", text: whisper.text }],
    badges: [],
    timestamp: whisper.timestamp,
  };
}

export function withSaved(saved: Whisper[], arrived: Whisper[]): Whisper[] {
  const known = new Set(saved.map((w) => w.id));
  return [...saved, ...arrived.filter((w) => !known.has(w.id))].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
}
