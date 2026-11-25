import { createSignal } from "solid-js";
import {
  listWhispers,
  markWhispersRead,
  saveWhispers,
  sendWhisper,
} from "../../platform/twitch/whispers.ts";
import type { UserRef, Whisper } from "../../shared/types/index.ts";
import { countUnread, withSaved } from "./model.ts";
import { user } from "../users/index.ts";

const [whispers, setWhispers] = createSignal<Whisper[]>([]);
const [openPeer, setOpenPeer] = createSignal<UserRef | null>(null);
const [drafts, setDrafts] = createSignal<UserRef[]>([]);
export { drafts, openPeer, whispers };

export const unreadCount = () => countUnread(whispers());

export function load(): void {
  const id = user()?.id;
  listWhispers({ silent: true })
    .then((saved) => {
      if (user()?.id !== id) return;
      setWhispers((arrived) => withSaved(saved, arrived));
    })
    .catch(() => {});
}

export function clear(): void {
  setWhispers([]);
  setOpenPeer(null);
  setDrafts([]);
}

function add(whisper: Whisper): void {
  if (whispers().some((w) => w.id === whisper.id)) return;
  setWhispers((list) => [...list, whisper]);
  saveWhispers({ whispers: [whisper] }, { silent: true }).catch(() => {});
}

export const receive = add;

export function back(): void {
  setOpenPeer(null);
}

export function discard(peerId: string): void {
  setDrafts((list) => list.filter((p) => p.id !== peerId));
  if (openPeer()?.id === peerId) setOpenPeer(null);
}

export function open(peer: UserRef): void {
  setOpenPeer(peer);
  if (!drafts().some((p) => p.id === peer.id)) {
    setDrafts((list) => [...list, peer]);
  }
  markRead(peer.id);
}

function markRead(peerId: string): void {
  const unread = (w: Whisper) => w.unread && w.peer.id === peerId;
  if (!whispers().some(unread)) return;
  setWhispers((list) =>
    list.map((w) => (unread(w) ? { ...w, unread: false } : w)),
  );
  markWhispersRead({ peerId }, { silent: true }).catch(() => {});
}

export async function send(peer: UserRef, text: string): Promise<boolean> {
  try {
    await sendWhisper({ toUserId: peer.id, message: text });
  } catch {
    return false;
  }
  add({
    id: crypto.randomUUID(),
    peer,
    outgoing: true,
    text,
    timestamp: Date.now(),
    unread: false,
  });
  return true;
}
