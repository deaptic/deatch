import { createSignal, Show } from "solid-js";
import type { User } from "../../lib/types/index.ts";
import { setExploreFilters } from "../../lib/stores/explore.ts";
import ExploreGreeting from "./ExploreGreeting.tsx";
import ExploreSearch from "./ExploreSearch.tsx";
import SearchResults from "./SearchResults.tsx";
import LiveNow from "./LiveNow.tsx";

type Props = {
  onSelectChannel: (channel: User) => void;
};

export default function Explore(props: Props) {
  const [query, setQuery] = createSignal("");

  return (
    <div class="flex-1 min-h-0 min-w-0 overflow-y-auto">
      <div class="mx-auto max-w-260 px-6 pt-10 pb-12">
        <ExploreGreeting />
        <ExploreSearch value={query()} onInput={setQuery} />
        <Show
          when={query().trim()}
          fallback={<LiveNow onSelect={props.onSelectChannel} />}
        >
          <SearchResults
            query={query()}
            onSelect={props.onSelectChannel}
            onSelectGame={(game) => {
              setExploreFilters("category", game);
              setQuery("");
            }}
          />
        </Show>
      </div>
    </div>
  );
}
