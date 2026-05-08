import { createSignal } from "solid-js";
import type { ChatMsg } from "./components/ChatMessage";

type ContextMenuState = { x: number; y: number; msg: ChatMsg } | null;
type ReplyState = { messageId: string; name: string; text: string } | null;
type ModActionState = { action: "timeout" | "ban"; msg: ChatMsg } | null;

export const [contextMenu, setContextMenu] = createSignal<ContextMenuState>(null);
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
