import { createSignal, onCleanup, onMount } from "solid-js";
import { Swords } from "lucide-solid";
import { type PendingRaid, RAID_DURATION_MS } from "../../lib/stores/raid.ts";
import * as raid from "../../lib/services/raid.ts";
import { knownUser } from "../../lib/stores/users.ts";
import Button from "../ui/Button.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";

type Props = {
  raid: PendingRaid;
  onOpenChannel: (channelId: string) => void;
};

export default function RaidBanner(props: Props) {
  const [now, setNow] = createSignal(Date.now());
  onMount(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    onCleanup(() => clearInterval(id));
  });

  const remaining = () =>
    Math.max(
      0,
      Math.ceil((RAID_DURATION_MS - (now() - props.raid.startedAt)) / 1000),
    );

  const link = createChannelLink(
    () => knownUser(props.raid.target.id),
    () => props.onOpenChannel(props.raid.target.id),
  );

  return (
    <div class="flex items-center gap-3 px-4 py-2.5 bg-raised border-b border-line-soft">
      <Swords class="size-4 shrink-0 text-event-raid" />
      <span class="min-w-0 truncate text-body text-ink">
        Raiding{" "}
        <b
          class={`font-semibold hover:underline ${link.cursor}`}
          {...link.handlers}
        >
          {props.raid.target.displayName}
        </b>{" "}
        in <span class="font-semibold tabular-nums">{remaining()}s</span>
      </span>
      <Button
        variant="neutral"
        size="sm"
        class="ml-auto"
        onClick={() => raid.cancel().catch(() => {})}
      >
        Cancel raid
      </Button>
      {link.menu()}
    </div>
  );
}
