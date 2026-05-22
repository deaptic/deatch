import { For, Show } from "solid-js";
import { banUser, unbanUser } from "../../commands/moderation";
import { user as currentUser, moderatedChannels } from "../../state/users";
import { moderationActionsDisabled } from "../../state/preferences";
import Button from "../../ui/Button";
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

type Props = {
  chatterId: string;
  broadcasterId: string;
};

export default function UserCardModActions(props: Props) {
  const canModerate = () => {
    if (moderationActionsDisabled()) return false;
    const me = currentUser();
    if (!me) return false;
    if (me.id === props.chatterId) return false;
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
        <Button
          variant="secondary"
          onClick={unban}
          title="Unban"
          aria-label="Unban"
          icon={<BanIcon class="w-4 h-4 text-success" />}
        />
        <div class="flex-1 grid grid-cols-6 gap-1.5 min-w-0">
          <For each={TIMEOUTS}>
            {(t) => (
              <Button
                variant="secondary"
                onClick={() => timeout(t.seconds)}
                title={`Timeout ${t.label}`}
                aria-label={`Timeout ${t.label}`}
                class="px-0 text-xs font-medium tabular-nums"
              >
                {t.label}
              </Button>
            )}
          </For>
        </div>
        <Button
          variant="secondary"
          onClick={ban}
          title="Ban"
          aria-label="Ban"
          icon={<BanIcon class="w-4 h-4 text-danger" />}
        />
      </div>
    </Show>
  );
}
