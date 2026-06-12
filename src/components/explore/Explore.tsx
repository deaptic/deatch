import { createSignal, Show } from "solid-js";
import type { User } from "../../lib/types/twitch/user.ts";
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
    <div class="@container min-w-0 flex-1 min-h-0 overflow-y-auto bg-bg-dark">
      <div class="mx-auto max-w-[1280px] px-4 pb-14 pt-5 @[760px]:px-8 @[760px]:pt-7">
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
