import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import {
  type BannedUser,
  banUser,
  getBannedUsers,
  unbanUser,
} from "../../lib/api/twitch/moderation.ts";
import Button from "../ui/Button.tsx";
import Dialog from "../ui/Dialog.tsx";
import Field from "../ui/Field.tsx";
import { user } from "../../lib/stores/users.ts";
import { shortcutManager } from "../../lib/managers/ShortcutManager.ts";

const DURATIONS = [
  { label: "1s", value: 1 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
  { label: "1h", value: 3600 },
  { label: "10h", value: 36000 },
  { label: "1d", value: 86400 },
  { label: "1w", value: 604800 },
];

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

  async function timeout(seconds: number) {
    if (pending() !== null) return;
    setPending(seconds);
    try {
      await banUser({
        broadcasterId: props.broadcasterId,
        userId: props.userId,
        duration: seconds,
        reason: reason(),
      });
      props.onClose();
    } finally {
      setPending(null);
    }
  }

  async function ban() {
    if (pending() !== null) return;
    setPending("ban");
    try {
      await banUser({
        broadcasterId: props.broadcasterId,
        userId: props.userId,
        duration: null,
        reason: reason(),
      });
      props.onClose();
    } finally {
      setPending(null);
    }
  }

  async function unban() {
    if (pending() !== null) return;
    setPending("unban");
    try {
      await unbanUser({
        broadcasterId: props.broadcasterId,
        userId: props.userId,
      });
      props.onClose();
    } finally {
      setPending(null);
    }
  }

  onMount(() => {
    shortcutManager.setContext("banModalOpen", true);
    const unbindEsc = shortcutManager.registerLocal(
      "escape",
      () => {
        props.onClose();
      },
      "banModalOpen",
    );
    onCleanup(() => {
      unbindEsc();
      shortcutManager.setContext("banModalOpen", false);
    });

    if (isBroadcaster()) {
      getBannedUsers(
        { broadcasterId: props.broadcasterId, userId: props.userId, first: 1 },
        { silent: true },
      )
        .then((res) => setBanInfo(res.data[0] ?? null))
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
        <div class="grid grid-cols-4 gap-1.5">
          <For each={DURATIONS}>
            {(d) => (
              <Button
                variant="neutral"
                size="sm"
                onClick={() => timeout(d.value)}
                loading={pending() === d.value}
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
