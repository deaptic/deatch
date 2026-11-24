import {
  type Accessor,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import { t } from "../../shared/i18n/index.ts";
import { addToast } from "../../kit/toasts.ts";
import { deleteChatMessages } from "../../platform/twitch/moderation.ts";
import type { FeedApi, FeedMessage } from "../feed/index.ts";
import { showsControls } from "../permissions/index.ts";
import { bans } from "../user-card/index.ts";
import { user } from "../users/index.ts";

const ARMED_MS = 5_000;
const BAN_CONFIRM_MS = 2_000;
const QUIET = { successMessage: undefined };
const ARMED = "modArmed";

type Deps = {
  broadcasterId: () => string;
  feed: () => FeedApi | null;
};

export type ModShortcuts = {
  armed: Accessor<FeedMessage | null>;
  canModerate: (m: FeedMessage) => boolean;
};

export function createModShortcuts(deps: Deps): ModShortcuts {
  const [armed, setArmed] = createSignal<FeedMessage | null>(null);
  let disarmTimer: ReturnType<typeof setTimeout> | undefined;
  let banPressedAt: number | null = null;

  const target = (m: FeedMessage) => ({
    broadcasterId: deps.broadcasterId(),
    userId: m.chatter_user_id,
  });

  const canModerate = (m: FeedMessage) =>
    showsControls(deps.broadcasterId(), "moderate") &&
    m.chatter_user_id !== user()?.id &&
    m.chatter_user_id !== deps.broadcasterId();

  function disarm() {
    clearTimeout(disarmTimer);
    banPressedAt = null;
    setArmed(null);
  }

  function arm() {
    const m = deps.feed()?.getSelectedMessage();
    if (!m || !canModerate(m)) return shortcuts.PASS;
    clearTimeout(disarmTimer);
    banPressedAt = null;
    setArmed(m);
    disarmTimer = setTimeout(disarm, ARMED_MS);
  }

  const whenArmed = (fn: (m: FeedMessage) => void) => () => {
    const m = armed();
    if (!m) return shortcuts.PASS;
    fn(m);
  };

  const once = (fn: (m: FeedMessage) => void) =>
    whenArmed((m) => {
      disarm();
      fn(m);
    });

  function removeWithUndo(m: FeedMessage, choice: "10m" | "ban") {
    bans
      .apply(target(m), choice, undefined, QUIET)
      .then(() =>
        addToast(
          t("MOD_KEYS_REMOVED_TOAST", {
            name: m.chatter_name,
            action: choice === "ban" ? "ban" : "timeout",
          }),
          "success",
          t("MOD_KEYS_UNDO_HINT"),
          () => void bans.apply(target(m), "unban").catch(() => {}),
        ),
      )
      .catch(() => {});
  }

  const ban = whenArmed((m) => {
    const now = Date.now();
    if (banPressedAt !== null && now - banPressedAt < BAN_CONFIRM_MS) {
      disarm();
      removeWithUndo(m, "ban");
      return;
    }
    banPressedAt = now;
    addToast(t("MOD_KEYS_BAN_CONFIRM_TOAST", { name: m.chatter_name }), "warn");
  });

  createEffect(
    on(
      () => deps.feed()?.getSelectedMessage()?.message_id,
      (id) => {
        if (armed() && armed()?.message_id !== id) disarm();
      },
    ),
  );
  createEffect(() => shortcuts.setContext(ARMED, armed() !== null));
  onCleanup(() => {
    clearTimeout(disarmTimer);
    shortcuts.setContext(ARMED, false);
  });

  onMount(() => {
    const stops = [
      shortcuts.register("mod::arm", arm, "feedSelected"),
      shortcuts.registerLocal("escape", disarm, ARMED),
      shortcuts.register(
        "mod::delete",
        once((m) =>
          deleteChatMessages({
            broadcasterId: deps.broadcasterId(),
            messageId: m.message_id,
          }).catch(() => {}),
        ),
        ARMED,
      ),
      shortcuts.register(
        "mod::purge",
        once((m) => void bans.apply(target(m), "1s").catch(() => {})),
        ARMED,
      ),
      shortcuts.register(
        "mod::timeout",
        once((m) => removeWithUndo(m, "10m")),
        ARMED,
      ),
      shortcuts.register("mod::ban", ban, ARMED),
    ];
    onCleanup(() => {
      for (const stop of stops) stop();
    });
  });

  return { armed, canModerate };
}
