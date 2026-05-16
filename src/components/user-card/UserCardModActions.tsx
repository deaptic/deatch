import { For, Show } from "solid-js";
import { banUser, unbanUser } from "../../commands/moderation";
import { user as currentUser, moderatedChannels } from "../../state/users";
import BanIcon from "../../icons/BanIcon";

type Timeout = { label: string; seconds: number };

const TIMEOUTS: Timeout[] = [
  { label: "1s", seconds: 1 },
  { label: "1m", seconds: 60 },
  { label: "10m", seconds: 600 },
  { label: "1h", seconds: 3600 },
  { label: "1d", seconds: 86400 },
  { label: "1w", seconds: 604800 },
];

const BTN_BASE =
  "h-9 flex items-center justify-center rounded-md bg-bg border border-border-muted text-text-muted hover:bg-bg-light hover:text-text cursor-pointer transition-colors";

type Props = {
  chatterId: string;
  broadcasterId: string;
};

export default function UserCardModActions(props: Props) {
  const canModerate = () => {
    const me = currentUser();
    if (!me) return false;
    if (me.id === props.broadcasterId) return true;
    return moderatedChannels().some(
      (c) => c.broadcaster_id === props.broadcasterId,
    );
  };

  const unban = () =>
    void unbanUser({
      broadcasterId: props.broadcasterId,
      userId: props.chatterId,
    }).catch(() => {});
  const ban = () =>
    void banUser({
      broadcasterId: props.broadcasterId,
      userId: props.chatterId,
    }).catch(() => {});
  const timeout = (seconds: number) =>
    void banUser({
      broadcasterId: props.broadcasterId,
      userId: props.chatterId,
      duration: seconds,
    }).catch(() => {});

  return (
    <Show when={canModerate()}>
      <div class="flex gap-1.5 p-2 border-b border-border-muted bg-bg shrink-0">
        <button
          onClick={unban}
          title="Unban"
          aria-label="Unban"
          class={`${BTN_BASE} shrink-0 w-9`}
        >
          <BanIcon class="w-4 h-4 text-success" />
        </button>
        <div class="flex-1 grid grid-cols-6 gap-1 min-w-0">
          <For each={TIMEOUTS}>
            {(t) => (
              <button
                onClick={() => timeout(t.seconds)}
                title={`Timeout ${t.label}`}
                aria-label={`Timeout ${t.label}`}
                class={`${BTN_BASE} text-xs font-medium tabular-nums`}
              >
                {t.label}
              </button>
            )}
          </For>
        </div>
        <button
          onClick={ban}
          title="Ban"
          aria-label="Ban"
          class={`${BTN_BASE} shrink-0 w-9`}
        >
          <BanIcon class="w-4 h-4 text-danger" />
        </button>
      </div>
    </Show>
  );
}
