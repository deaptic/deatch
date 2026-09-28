import { createSignal, onCleanup, onMount } from "solid-js";
import { Swords } from "lucide-solid";
import {
  cancelActiveRaid,
  type PendingRaid,
  RAID_DURATION_MS,
} from "../../lib/stores/raid.ts";
import Button from "../ui/Button.tsx";

type Props = {
  raid: PendingRaid;
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

  return (
    <div class="flex items-center gap-3 px-4 py-2.5 bg-raised border-b border-line-soft">
      <Swords class="size-4 shrink-0 text-event-raid" />
      <span class="min-w-0 truncate text-body text-ink">
        Raiding <b class="font-semibold">{props.raid.target.displayName}</b> in
        {" "}
        <span class="font-semibold tabular-nums">{remaining()}s</span>
      </span>
      <Button
        variant="neutral"
        size="sm"
        class="ml-auto"
        onClick={() => cancelActiveRaid()}
      >
        Cancel raid
      </Button>
    </div>
  );
}
