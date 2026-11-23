import { createSignal, Show } from "solid-js";
import type { User } from "../../shared/types/index.ts";
import type { ListboxField } from "../../shared/solid/createListbox.ts";
import { setCategory } from "./store.ts";
import ExploreBar from "./ExploreBar.tsx";
import SearchResults from "./SearchResults.tsx";
import FollowingLive from "./FollowingLive.tsx";
import Popular from "./Popular.tsx";
import RecentChannels from "./RecentChannels.tsx";
import TopCategories from "./TopCategories.tsx";

type Props = {
  onSelectChannel: (channel: User) => void;
};

export default function Explore(props: Props) {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<ListboxField>();

  return (
    <div class="flex-1 min-h-0 min-w-0 overflow-y-auto">
      <ExploreBar query={query()} onQuery={setQuery} listbox={results()} />
      <div class="mx-auto max-w-260 px-6 pt-4 pb-12">
        <Show
          when={query().trim()}
          fallback={
            <div class="flex flex-col gap-10">
              <FollowingLive onSelect={props.onSelectChannel} />
              <RecentChannels onSelect={props.onSelectChannel} />
              <TopCategories />
              <Popular onSelect={props.onSelectChannel} />
            </div>
          }
        >
          <SearchResults
            query={query()}
            ref={setResults}
            onSelect={props.onSelectChannel}
            onSelectGame={(game) => {
              setCategory(game);
              setQuery("");
            }}
          />
        </Show>
      </div>
    </div>
  );
}
