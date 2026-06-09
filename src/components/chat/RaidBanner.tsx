import { createSignal, onCleanup, onMount } from "solid-js";
import { Swords } from "lucide-solid";
import {
  cancelActiveRaid,
  type PendingRaid,
  RAID_DURATION_MS,
} from "../../lib/stores/raid.ts";

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
    <div class="flex h-12 items-center gap-3 border-b border-primary/40 bg-primary/15 px-4">
      <Swords class="size-5 shrink-0 text-primary" />
      <span class="min-w-0 truncate text-sm text-text">
        Raiding <b class="font-semibold">{props.raid.target.displayName}</b>
      </span>
      <span class="shrink-0 rounded-md bg-bg-dark/40 px-2.5 py-1 text-sm font-bold tabular-nums text-text">
        {remaining()}s
      </span>
      <button
        type="button"
        onClick={() => cancelActiveRaid()}
        class="ml-auto shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-bg hover:text-text"
      >
        Cancel
      </button>
    </div>
  );
}
