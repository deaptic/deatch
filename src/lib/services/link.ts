import { selectedChannel } from "../stores/view.ts";
import { linkMutedByLogin, linkWarmedChannels } from "../stores/link.ts";
import { linkSetMuted } from "../api/link.ts";

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
