import { createSignal } from "solid-js";
import type { FeedMessage, FeedEvent } from "./components/feed/types";

type ContextMenuState = { x: number; y: number; msg: FeedMessage } | null;
type EventMenuState = { x: number; y: number; item: FeedEvent } | null;
type ReplyState = { messageId: string; name: string; text: string } | null;
type ModActionState = { action: "timeout" | "ban"; msg: FeedMessage } | null;

export const [contextMenu, setContextMenu] = createSignal<ContextMenuState>(null);
export const [eventContextMenu, setEventContextMenu] = createSignal<EventMenuState>(null);
export const [replyTo, setReplyTo] = createSignal<ReplyState>(null);
export const [modAction, setModAction] = createSignal<ModActionState>(null);

let _focusInput: (() => void) | undefined;

export function registerInputFocus(fn: () => void) {
  _focusInput = fn;
}

export function openContextMenu(x: number, y: number, msg: FeedMessage) {
  setContextMenu({ x, y, msg });
}

export function closeContextMenu() {
  setContextMenu(null);
}

export function openEventContextMenu(x: number, y: number, item: FeedEvent) {
  setEventContextMenu({ x, y, item });
}

export function closeEventContextMenu() {
  setEventContextMenu(null);
}

export function openModAction(action: "timeout" | "ban", msg: FeedMessage) {
  setModAction({ action, msg });
}

export function closeModAction() {
  setModAction(null);
}

export function startReply(msg: FeedMessage) {
  setReplyTo({
    messageId: msg.message_id,
    name: msg.chatter_name,
    text: msg.fragments.map((f) => f.text).join(""),
  });
  _focusInput?.();
}

export function clearReply() {
  setReplyTo(null);
}
