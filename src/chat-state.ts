import { createSignal } from "solid-js";
import type { ChatMsg } from "./components/ChatMessage";
import type { ChatNotice } from "./components/ChatNotification";

type ContextMenuState = { x: number; y: number; msg: ChatMsg } | null;
type NotifMenuState = { x: number; y: number; item: ChatNotice } | null;
type ReplyState = { messageId: string; name: string; text: string } | null;
type ModActionState = { action: "timeout" | "ban"; msg: ChatMsg } | null;

export const [contextMenu, setContextMenu] = createSignal<ContextMenuState>(null);
export const [notifContextMenu, setNotifContextMenu] = createSignal<NotifMenuState>(null);
export const [replyTo, setReplyTo] = createSignal<ReplyState>(null);
export const [modAction, setModAction] = createSignal<ModActionState>(null);

let _focusInput: (() => void) | undefined;

export function registerInputFocus(fn: () => void) {
  _focusInput = fn;
}

export function openContextMenu(x: number, y: number, msg: ChatMsg) {
  setContextMenu({ x, y, msg });
}

export function closeContextMenu() {
  setContextMenu(null);
}

export function openNotifContextMenu(x: number, y: number, item: ChatNotice) {
  setNotifContextMenu({ x, y, item });
}

export function closeNotifContextMenu() {
  setNotifContextMenu(null);
}

export function openModAction(action: "timeout" | "ban", msg: ChatMsg) {
  setModAction({ action, msg });
}

export function closeModAction() {
  setModAction(null);
}

export function startReply(msg: ChatMsg) {
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
