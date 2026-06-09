import { createSignal, Show } from "solid-js";
import type { User } from "../../lib/types/twitch/user.ts";
import type { Category } from "../../lib/api/twitch/search.ts";
import DashboardGreeting from "./DashboardGreeting.tsx";
import DashboardSearch from "./DashboardSearch.tsx";
import SearchResults from "./SearchResults.tsx";
import LiveNow from "./LiveNow.tsx";

type Props = {
  onSelectChannel: (channel: User) => void;
};

export default function Dashboard(props: Props) {
  const [query, setQuery] = createSignal("");
  const [category, setCategory] = createSignal<Category | null>(null);

  return (
    <div class="@container min-w-0 flex-1 min-h-0 overflow-y-auto bg-bg-dark">
      <div class="mx-auto max-w-[1280px] px-4 pb-14 pt-5 @[760px]:px-8 @[760px]:pt-7">
        <DashboardGreeting />
        <DashboardSearch value={query()} onInput={setQuery} />
        <Show
          when={query().trim()}
          fallback={
            <LiveNow
              onSelect={props.onSelectChannel}
              category={category()}
              onClearCategory={() => setCategory(null)}
            />
          }
        >
          <SearchResults
            query={query()}
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
