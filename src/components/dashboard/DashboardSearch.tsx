import { Search, X } from "lucide-solid";
import { Show } from "solid-js";

type Props = {
  value: string;
  onInput: (value: string) => void;
};

export default function DashboardSearch(props: Props) {
  return (
    <div class="mb-6 flex items-center gap-2 rounded-lg border border-border-muted bg-bg px-3">
      <Search class="size-4 shrink-0 text-text-muted" />
      <input
        type="text"
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        placeholder="Search Twitch channels…"
        class="h-10 w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
      />
      <Show when={props.value}>
        <button
          type="button"
          onClick={() => props.onInput("")}
          aria-label="Clear search"
          class="shrink-0 text-text-muted transition-colors hover:text-text"
        >
          <X class="size-4" />
        </button>
      </Show>
    </div>
  );
}
