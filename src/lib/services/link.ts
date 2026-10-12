import { selectedChannel } from "../stores/view.ts";
import { linkMutedByLogin, linkWarmedChannels } from "../stores/link.ts";
import { linkClose, linkSetMuted } from "../api/link.ts";
import { getStreamsFromIds } from "../api/twitch/streams.ts";
import { addToast } from "../stores/toasts.ts";
import type { User } from "../types/index.ts";

function closeTabs(tabs: User[]) {
  for (const ch of tabs) if (ch?.login) void linkClose(ch.login);
}

export function closeAll() {
  closeTabs(linkWarmedChannels());
}

// Checks live status fresh so a tab that just went live stays open.
export async function closeOffline() {
  const tabs = linkWarmedChannels();
  if (tabs.length === 0) return;
  const streams = await getStreamsFromIds({ userIds: tabs.map((c) => c.id) });
  const live = new Set(streams.map((s) => s.user.id));
  const offline = tabs.filter((c) => !live.has(c.id));
  if (offline.length === 0) {
    addToast("Every tab is live");
    return;
  }
  closeTabs(offline);
  addToast(
    `Closed ${offline.length} offline ${offline.length === 1 ? "tab" : "tabs"}`,
    "success",
  );
}

function isMuted(login: string): boolean {
  return linkMutedByLogin()[login] === true;
}

function selectedLinked() {
  const sel = selectedChannel();
  return sel && linkWarmedChannels().some((c) => c?.id === sel.id) ? sel : null;
}

export function anyUnmuted(): boolean {
  return linkWarmedChannels().some((ch) => ch?.login && !isMuted(ch.login));
}

// Only the shown tab plays; every other tab goes quiet.
export function muteOthers() {
  const focusedLogin = selectedLinked()?.login ?? null;
  for (const ch of linkWarmedChannels()) {
    if (!ch?.login) continue;
    const shouldBeMuted = ch.login !== focusedLogin;
    if (isMuted(ch.login) !== shouldBeMuted) {
      void linkSetMuted(ch.login, shouldBeMuted);
    }
  }
}

export function toggleMuteAll() {
  const linked = linkWarmedChannels();
  if (linked.length === 0) return;
  const muteAll = anyUnmuted();
  for (const ch of linked) {
    if (!ch?.login) continue;
    if (isMuted(ch.login) !== muteAll) void linkSetMuted(ch.login, muteAll);
  }
}

// null when the shown chat has no browser tab.
export function currentMuted(): boolean | null {
  const target = selectedLinked();
  return target?.login ? isMuted(target.login) : null;
}

export function toggleMute() {
  const target = selectedLinked();
  if (!target?.login) return;
  void linkSetMuted(target.login, !isMuted(target.login));
}
