import type { BannedUser } from "../../lib/types/index.ts";
import { createSignal, onMount, Show } from "solid-js";
import { getBan } from "../../lib/api/twitch/moderation.ts";
import * as bans from "../../lib/services/bans.ts";
import { type BanChoice, secondsFor } from "../../lib/constants/timeouts.ts";
import { formatDuration } from "../../lib/format/duration.ts";
import Button from "../ui/Button.tsx";
import Dialog from "../ui/Dialog.tsx";
import { autofocus } from "../../lib/reactive/focus.ts";
import Textarea from "../ui/Textarea.tsx";
import BanChoiceStrip from "./BanChoiceStrip.tsx";
import { user } from "../../lib/stores/users.ts";
import { formatLocale, t, tRich } from "../../lib/i18n/index.ts";

type Props = {
  userId: string;
  userName: string;
  broadcasterId: string;
  onClose: () => void;
};

const DEFAULT_CHOICE: BanChoice = "10m";

/// Whether Twitch says they are banned. Only the broadcaster may ask, so
/// for a mod it is always clear.
type BanStatus =
  | { kind: "loading" }
  | { kind: "clear" }
  | { kind: "banned"; ban: BannedUser };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(formatLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BanModal(props: Props) {
  const [choice, setChoice] = createSignal<BanChoice>(DEFAULT_CHOICE);
  const [reason, setReason] = createSignal("");
  const [pending, setPending] = createSignal(false);
  const [status, setStatus] = createSignal<BanStatus>({ kind: "loading" });
  const ban = () => {
    const s = status();
    return s.kind === "banned" ? s.ban : null;
  };

  const isBroadcaster = () => user()?.id === props.broadcasterId;
  const confirmLabel = () => {
    const picked = choice();
    if (picked === "unban") return t("BAN_UNBAN");
    const seconds = secondsFor(picked);
    return seconds === null
      ? t("BAN_BAN")
      : t("BAN_TIME_OUT", { duration: formatDuration(seconds) });
  };

  async function confirm() {
    if (pending() || status().kind === "loading") return;
    setPending(true);
    try {
      await bans.apply(
        { broadcasterId: props.broadcasterId, userId: props.userId },
        choice(),
        reason(),
      );
      props.onClose();
    } catch {
      // invokeCommand already toasted; the modal stays open to retry.
    } finally {
      setPending(false);
    }
  }

  onMount(() => {
    if (!isBroadcaster()) {
      // Twitch's banned-users endpoint is broadcaster-only. Mods can still
      // unban — they just do it without a status hint.
      setStatus({ kind: "clear" });
      return;
    }
    getBan(
      { broadcasterId: props.broadcasterId, userId: props.userId },
      { silent: true },
    )
      .then((info) => {
        setStatus(info ? { kind: "banned", ban: info } : { kind: "clear" });
        if (info) setChoice("unban");
      })
      .catch(() => setStatus({ kind: "clear" }));
  });

  return (
    <Dialog
      title={t("BAN_TITLE", { name: props.userName })}
      onClose={props.onClose}
      actions={
        <>
          <Button variant="neutral" onClick={props.onClose}>
            {t("BAN_CANCEL")}
          </Button>
          <Button
            variant={choice() === "unban" ? "accent" : "danger"}
            onClick={confirm}
            loading={pending() || status().kind === "loading"}
          >
            {confirmLabel()}
          </Button>
        </>
      }
    >
      <Show when={ban()}>
        {(info) => (
          <div class="bg-negative/10 border-l-3 border-negative rounded-sm px-3 py-2.5 flex flex-col gap-0.5 text-small">
            <span class="text-ink">
              {tRich("BAN_STATUS_BY", {
                status: info().expiresAt ? "timeout" : "ban",
                moderator: info().moderator.displayName,
                name: (chunks) => <span class="font-semibold">{chunks}</span>,
              })}
            </span>
            <Show when={info().reason}>
              {(reason) => (
                <span class="text-ink-soft">
                  {t("BAN_REASON", { reason: reason() })}
                </span>
              )}
            </Show>
            <Show when={info().expiresAt}>
              {(expiresAt) => (
                <span class="text-ink-soft">
                  {t("BAN_EXPIRES", { date: formatDate(expiresAt()) })}
                </span>
              )}
            </Show>
          </div>
        )}
      </Show>

      <BanChoiceStrip value={choice()} onChange={setChoice} />

      <Textarea
        placeholder={t("BAN_REASON_PLACEHOLDER")}
        value={reason()}
        disabled={choice() === "unban"}
        onInput={(e) => setReason(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void confirm();
          }
        }}
        ref={autofocus}
      />
    </Dialog>
  );
}
