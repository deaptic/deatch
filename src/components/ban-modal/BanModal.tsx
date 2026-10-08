import type { BannedUser } from "../../lib/types/index.ts";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { banUser, getBan, unbanUser } from "../../lib/api/twitch/moderation.ts";
import Button from "../ui/Button.tsx";
import Dialog from "../ui/Dialog.tsx";
import Field from "../ui/Field.tsx";
import { user } from "../../lib/stores/users.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import { TIMEOUT_PRESETS } from "../../lib/constants/timeouts.ts";

type BanInfo = BannedUser;

type Props = {
  userId: string;
  userName: string;
  broadcasterId: string;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BanModal(props: Props) {
  const [reason, setReason] = createSignal("");
  const [pending, setPending] = createSignal<number | "ban" | "unban" | null>(
    null,
  );
  // undefined = loading, null = not banned, object = banned with details.
  const [banInfo, setBanInfo] = createSignal<BanInfo | null | undefined>(
    undefined,
  );

  const isBroadcaster = () => user()?.id === props.broadcasterId;

  async function run(
    kind: number | "ban" | "unban",
    action: () => Promise<unknown>,
  ) {
    if (pending() !== null) return;
    setPending(kind);
    try {
      await action();
      props.onClose();
    } catch {
      // invokeCommand already toasted; the modal stays open to retry.
    } finally {
      setPending(null);
    }
  }

  const timeout = (seconds: number) =>
    run(seconds, () =>
      banUser({
        broadcasterId: props.broadcasterId,
        userId: props.userId,
        duration: seconds,
        reason: reason(),
      }));

  const ban = () =>
    run("ban", () =>
      banUser({
        broadcasterId: props.broadcasterId,
        userId: props.userId,
        duration: null,
        reason: reason(),
      }));

  const unban = () =>
    run("unban", () =>
      unbanUser({
        broadcasterId: props.broadcasterId,
        userId: props.userId,
      }));

  onMount(() => {
    shortcuts.setContext("banModalOpen", true);
    const unbindEsc = shortcuts.registerLocal(
      "escape",
      () => {
        props.onClose();
      },
      "banModalOpen",
    );
    onCleanup(() => {
      unbindEsc();
      shortcuts.setContext("banModalOpen", false);
    });

    if (isBroadcaster()) {
      getBan(
        { broadcasterId: props.broadcasterId, userId: props.userId },
        { silent: true },
      )
        .then(setBanInfo)
        .catch(() => setBanInfo(null));
    } else {
      // Twitch's banned-users endpoint is broadcaster-only. Mods can still
      // ban/unban — they just have to pick the action without a status hint.
      setBanInfo(null);
    }
  });

  return (
    <Dialog
      title={`Ban or time out ${props.userName}`}
      description="Pick a timeout, ban outright, or lift an existing ban."
      onClose={props.onClose}
      actions={
        <>
          <Button variant="neutral" onClick={props.onClose}>Cancel</Button>
          <Show
            when={isBroadcaster()}
            fallback={
              <>
                <Button
                  variant="neutral"
                  onClick={unban}
                  loading={pending() === "unban"}
                  disabled={pending() !== null}
                >
                  Unban
                </Button>
                <Button
                  variant="danger"
                  onClick={ban}
                  loading={pending() === "ban"}
                  disabled={pending() !== null}
                >
                  Ban
                </Button>
              </>
            }
          >
            <Button
              variant={banInfo() ? "neutral" : "danger"}
              onClick={banInfo() ? unban : ban}
              loading={pending() === "ban" || pending() === "unban" ||
                banInfo() === undefined}
              disabled={pending() !== null}
            >
              {banInfo() ? "Unban" : "Ban"}
            </Button>
          </Show>
        </>
      }
    >
      <Show when={banInfo()}>
        {(info) => (
          <div class="bg-negative/10 border-l-3 border-negative rounded-sm px-3 py-2.5 flex flex-col gap-0.5 text-small">
            <span class="text-ink">
              {info().expiresAt ? "Timed out" : "Banned"} by{" "}
              <span class="font-semibold">{info().moderator.displayName}</span>
            </span>
            <Show when={info().reason}>
              <span class="text-ink-soft">Reason: {info().reason}</span>
            </Show>
            <Show when={info().expiresAt}>
              <span class="text-ink-soft">
                Expires: {formatDate(info().expiresAt)}
              </span>
            </Show>
          </div>
        )}
      </Show>

      <Field
        placeholder="Reason (optional)"
        value={reason()}
        onInput={(e) => setReason(e.currentTarget.value)}
        autofocus
      />

      <div class="flex flex-col gap-2">
        <span class="text-small text-ink-soft">Time out for</span>
        <div class="grid grid-cols-3 gap-1.5">
          <For each={TIMEOUT_PRESETS}>
            {(d) => (
              <Button
                variant="neutral"
                size="sm"
                onClick={() => timeout(d.seconds)}
                loading={pending() === d.seconds}
                disabled={pending() !== null}
              >
                {d.label}
              </Button>
            )}
          </For>
        </div>
      </div>
    </Dialog>
  );
}
