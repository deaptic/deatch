import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import {
  banUser,
  getBannedUsers,
  unbanUser,
  type GetBannedUsersResponse,
} from "../../commands/moderation";
import Button from "../../ui/Button";
import TextInput from "../../ui/TextInput";

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

type BanInfo = GetBannedUsersResponse["data"][number];

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
  const [pending, setPending] = createSignal<number | "ban" | null>(null);
  // undefined = loading, null = not banned, object = banned with details.
  const [banInfo, setBanInfo] = createSignal<BanInfo | null | undefined>(undefined);

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

  async function toggleBan() {
    if (pending() !== null || banInfo() === undefined) return;
    setPending("ban");
    try {
      if (banInfo()) {
        await unbanUser({ broadcasterId: props.broadcasterId, userId: props.userId });
      } else {
        await banUser({
          broadcasterId: props.broadcasterId,
          userId: props.userId,
          duration: null,
          reason: reason(),
        });
      }
      props.onClose();
    } finally {
      setPending(null);
    }
  }

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));

    getBannedUsers(
      { broadcasterId: props.broadcasterId, userId: props.userId, first: 1 },
      { silent: true },
    )
      .then((res) => setBanInfo(res.data[0] ?? null))
      .catch(() => setBanInfo(null));
  });

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <div class="bg-bg border border-border-muted rounded-lg shadow-2xl w-96 p-4 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-text text-sm font-semibold">Ban / Timeout {props.userName}</span>
          <span class="text-text-muted text-xs">
            Pick a timeout duration, ban, or remove an existing ban.
          </span>
        </div>

        <Show when={banInfo()}>
          {(info) => (
            <div class="bg-danger/10 border border-danger/40 rounded p-2.5 flex flex-col gap-1 text-xs">
              <span class="text-text">
                {info().expires_at ? "Timed out" : "Banned"} by{" "}
                <span class="font-semibold">{info().moderator_name}</span> · {formatDate(info().created_at)}
              </span>
              <Show when={info().reason}>
                <span class="text-text-muted">Reason: {info().reason}</span>
              </Show>
              <Show when={info().expires_at}>
                <span class="text-text-muted">Expires: {formatDate(info().expires_at!)}</span>
              </Show>
            </div>
          )}
        </Show>

        <TextInput
          placeholder="Reason (optional)"
          value={reason()}
          onInput={(e) => setReason(e.currentTarget.value)}
          autofocus
        />

        <div class="flex flex-col gap-1.5">
          <span class="text-text-muted text-xs">Timeout</span>
          <div class="grid grid-cols-4 gap-1.5">
            <For each={DURATIONS}>
              {(d) => (
                <button
                  onClick={() => timeout(d.value)}
                  disabled={pending() !== null}
                  class="text-sm px-2 py-1 rounded border bg-bg-light border-border text-text-muted hover:text-text hover:border-highlight disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {pending() === d.value ? "…" : d.label}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <Button variant="secondary" onClick={props.onClose}>Cancel</Button>
          <Button
            variant={banInfo() ? "secondary" : "danger"}
            onClick={toggleBan}
            disabled={pending() !== null || banInfo() === undefined}
          >
            {pending() === "ban"
              ? "…"
              : banInfo() === undefined
                ? "…"
                : banInfo()
                  ? "Unban"
                  : "Ban"}
          </Button>
        </div>
      </div>
    </div>
  );
}
