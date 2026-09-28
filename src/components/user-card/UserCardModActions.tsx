import { Ban } from "lucide-solid";
import { For, Show } from "solid-js";
import { banUser, unbanUser } from "../../lib/api/twitch/moderation.ts";
import {
  moderatedChannels,
  user as currentUser,
} from "../../lib/stores/users.ts";
import { moderationActionsDisabled } from "../../lib/stores/preferences.ts";
import Button from "../ui/Button.tsx";

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
    return moderatedChannels().some((c) => c.id === props.broadcasterId);
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
      <div class="flex gap-1.5 p-2.5 border-b border-line-soft shrink-0">
        <Button
          variant="neutral"
          size="sm"
          onClick={unban}
          title="Unban"
          aria-label="Unban"
          icon={<Ban class="size-4 text-positive" />}
        />
        <div class="flex-1 grid grid-cols-6 gap-1.5 min-w-0">
          <For each={TIMEOUTS}>
            {(t) => (
              <Button
                variant="neutral"
                size="sm"
                onClick={() => timeout(t.seconds)}
                title={`Time out ${t.label}`}
                aria-label={`Time out ${t.label}`}
              >
                {t.label}
              </Button>
            )}
          </For>
        </div>
        <Button
          variant="neutral"
          size="sm"
          onClick={ban}
          title="Ban"
          aria-label="Ban"
          icon={<Ban class="size-4 text-negative" />}
        />
      </div>
    </Show>
  );
}
