import type { BannedUser } from "../../lib/types/index.ts";
import { createSignal, onMount, Show } from "solid-js";
import { getBan } from "../../platform/twitch/moderation.ts";
import * as bans from "../../lib/services/bans.ts";
import { type BanChoice, secondsFor } from "../../lib/constants/timeouts.ts";
import { formatDuration } from "../../shared/format/duration.ts";
import { Time } from "../../shared/time.ts";
import Button from "../../kit/Button.tsx";
import Callout from "../../kit/Callout.tsx";
import Dialog from "../../kit/Dialog.tsx";
import { autofocus } from "../../shared/solid/focus.ts";
import Textarea from "../../kit/Textarea.tsx";
import BanChoiceStrip from "./BanChoiceStrip.tsx";
import { hasPermission } from "../../lib/stores/roles.ts";
import { t, tRich } from "../../shared/i18n/index.ts";

type Props = {
  userId: string;
  userName: string;
  broadcasterId: string;
  onClose: () => void;
};

const DEFAULT_CHOICE: BanChoice = "10m";

type BanStatus =
  | { kind: "loading" }
  | { kind: "clear" }
  | { kind: "banned"; ban: BannedUser };

export default function BanModal(props: Props) {
  const [choice, setChoice] = createSignal<BanChoice>(DEFAULT_CHOICE);
  const [reason, setReason] = createSignal("");
  const [pending, setPending] = createSignal(false);
  const [status, setStatus] = createSignal<BanStatus>({ kind: "loading" });
  const ban = () => {
    const s = status();
    return s.kind === "banned" ? s.ban : null;
  };

  const confirmLabel = () => {
    const picked = choice();
    if (picked === "unban") return t("BAN_UNBAN_LABEL");
    const seconds = secondsFor(picked);
    return seconds === null
      ? t("BAN_BAN_LABEL")
      : t("BAN_TIME_OUT_LABEL", { duration: formatDuration(seconds) });
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
    } finally {
      setPending(false);
    }
  }

  onMount(() => {
    if (!hasPermission(props.broadcasterId, "viewBans")) {
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
            {t("BAN_CANCEL_LABEL")}
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
          <Callout tone="negative">
            <span class="text-ink">
              {tRich("BAN_ISSUED_BY_STATUS", {
                status: info().expiresAt ? "timeout" : "ban",
                moderator: info().moderator.displayName,
                name: (chunks) => <span class="font-semibold">{chunks}</span>,
              })}
            </span>
            <Show when={info().reason}>
              {(reason) => (
                <span class="text-ink-soft">
                  {t("BAN_REASON_STATUS", { reason: reason() })}
                </span>
              )}
            </Show>
            <Show when={info().expiresAt}>
              {(expiresAt) => (
                <span class="text-ink-soft">
                  {t("BAN_EXPIRES_STATUS", {
                    date: new Time(expiresAt(), "f").toString(),
                  })}
                </span>
              )}
            </Show>
          </Callout>
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
