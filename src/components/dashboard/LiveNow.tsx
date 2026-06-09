import { createSignal, For, Show } from "solid-js";
import type { User } from "../../lib/types/twitch/user.ts";
import { liveStreams } from "../../lib/stores/channels.ts";
import SectionHeader from "./SectionHeader.tsx";
import LiveCard from "./LiveCard.tsx";

type Props = {
  onSelect: (channel: User) => void;
};

type SortKey = "viewers" | "uptime";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "viewers", label: "Viewers" },
  { key: "uptime", label: "Uptime" },
];

export default function LiveNow(props: Props) {
  const [sort, setSort] = createSignal<SortKey>("viewers");

  const sorted = () => {
    const list = [...liveStreams()];
    if (sort() === "uptime") {
      return list.sort((a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      );
    }
    return list.sort((a, b) => b.viewerCount - a.viewerCount);
  };

  return (
    <section class="mb-8">
      <SectionHeader title="Live now" count={liveStreams().length}>
        <Show when={liveStreams().length > 1}>
          <For each={SORTS}>
            {(option) => (
              <button
                type="button"
                onClick={() => setSort(option.key)}
                class="rounded-md px-2 py-1 text-xs font-medium transition-colors"
                classList={{
                  "bg-bg-light text-text": sort() === option.key,
                  "text-text-muted hover:text-text": sort() !== option.key,
                }}
              >
                {option.label}
              </button>
            )}
          </For>
        </Show>
      </SectionHeader>

      <Show
        when={liveStreams().length > 0}
        fallback={
          <p class="rounded-lg border border-dashed border-border-muted px-4 py-8 text-center text-sm text-text-muted">
            None of the channels you follow are live right now.
          </p>
        }
      >
        <div class="grid auto-rows-fr grid-cols-1 gap-x-4 gap-y-6 @[440px]:grid-cols-2 @[820px]:grid-cols-3 @[1180px]:grid-cols-4">
          <For each={sorted()}>
            {(stream) => <LiveCard stream={stream} onSelect={props.onSelect} />}
          </For>
        </div>
      </Show>
    </section>
  );
}
