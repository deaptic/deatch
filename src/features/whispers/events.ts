import { createEffect, createRoot, on } from "solid-js";
import {
  listenEventSub,
  serverTime,
  unlistenAll,
} from "../../platform/listen.ts";
import type { RawWhisper } from "../../platform/twitch/eventsubPayloads.ts";
import { flashTaskbar } from "../../platform/notifications.ts";
import { addToast } from "../../kit/toasts.ts";
import { playNotificationSound } from "../../kit/notificationSound.ts";
import { t } from "../../shared/i18n/index.ts";
import { user } from "../users/index.ts";
import { activeView, showWhispers } from "../navigation/index.ts";
import { notificationsWhisperSound } from "../preferences/index.ts";
import { whisperFrom } from "./model.ts";
import * as whispers from "./store.ts";

function viewing(peerId: string): boolean {
  return activeView() === "whispers" && whispers.openPeer()?.id === peerId;
}

function arrive(raw: RawWhisper, timestamp: number): void {
  const seen = viewing(raw.from_user_id);
  const whisper = whisperFrom(raw, timestamp, !seen);
  whispers.receive(whisper);
  if (seen && document.hasFocus()) return;
  if (!seen) {
    addToast(
      t("WHISPERS_RECEIVED_TOAST", { name: whisper.peer.displayName }),
      "info",
      whisper.text,
      () => {
        whispers.open(whisper.peer);
        showWhispers();
      },
    );
  }
  if (notificationsWhisperSound()) playNotificationSound();
  flashTaskbar({ silent: true }).catch(() => {});
}

export function start(): () => void {
  const stopAccount = createRoot((dispose) => {
    createEffect(
      on(
        () => user()?.id,
        (id) => {
          whispers.clear();
          if (id) whispers.load();
        },
      ),
    );
    return dispose;
  });
  const stop = unlistenAll([
    listenEventSub<RawWhisper>("user.whisper.message", (e) =>
      arrive(e.event, serverTime(e)),
    ),
  ]);
  return () => {
    stop();
    stopAccount();
  };
}
