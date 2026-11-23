import {
  createEffect,
  createResource,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { createDebounced } from "../../shared/solid/createDebounced.ts";
import type { Category, SearchChannel, User } from "../../lib/types/index.ts";
import {
  searchCategories,
  searchChannels,
} from "../../platform/twitch/search.ts";
import * as users from "../../lib/services/users.ts";
import {
  createListbox,
  type ListboxField,
} from "../../shared/solid/createListbox.ts";
import { userFromSearch } from "../../lib/utils/knownUsers.ts";
import { rankChannels } from "../channels/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import { liveLine } from "../../shared/format/stream.ts";
import { createChannelLink } from "../menus/index.ts";
import CategoryRow from "./ui/CategoryRow.tsx";
import Avatar from "../../kit/Avatar.tsx";
import EmptyState from "../../kit/EmptyState.tsx";
import LivePill from "../../kit/LivePill.tsx";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  query: string;
  onSelect: (channel: User) => void;
  onSelectGame: (game: Category) => void;
  ref: (field: ListboxField | undefined) => void;
};

const SEARCH_DEBOUNCE_MS = 300;

export default function SearchResults(props: Props) {
  const debounced = createDebounced(
    () => props.query.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const [results] = createResource(debounced, (q) =>
    q ? searchChannels({ query: q, first: 24 }).catch(() => []) : [],
  );

  const [categories] = createResource(debounced, (q) =>
    q ? searchCategories({ query: q, first: 8 }).catch(() => []) : [],
  );

  const ranked = () => rankChannels(debounced(), results() ?? []);

  function open(channel: SearchChannel) {
    const user = userFromSearch(channel);
    users.note([user]);
    props.onSelect(user);
  }

  async function forceOpenByLogin() {
    const login = props.query.trim().toLowerCase();
    if (!login) return;
    const found = await users.lookUp(
      login,
      t("EXPLORE_CHANNEL_NOT_FOUND_ERROR"),
    );
    if (found) props.onSelect(found);
  }

  const listbox = createListbox({ count: () => ranked().length });

  createEffect(on(results, () => listbox.setActive(0), { defer: true }));

  onMount(() => {
    props.ref(listbox.field);
    const unbind = shortcuts.bindScope("exploreSearchOpen", {
      up: () => listbox.move(-1),
      down: () => listbox.move(1),
      enter: () => {
        const channel = ranked()[listbox.active()];
        if (channel) open(channel);
        else void forceOpenByLogin();
      },
    });
    onCleanup(() => {
      unbind();
      props.ref(undefined);
    });
  });

  return (
    <div class="flex flex-col gap-8">
      <Show when={categories()?.length}>
        <section>
          <h2 class="mb-3 text-heading text-ink">
            {t("EXPLORE_CATEGORIES_TITLE")}
          </h2>
          <CategoryRow
            categories={categories() ?? []}
            onSelect={props.onSelectGame}
          />
        </section>
      </Show>

      <Show
        when={ranked().length}
        fallback={
          <Show when={!categories()?.length}>
            <EmptyState
              variant="inline"
              body={
                results.loading || categories.loading
                  ? t("EXPLORE_SEARCHING_STATUS")
                  : t("EXPLORE_NO_RESULTS_EMPTY", { query: debounced() })
              }
            />
          </Show>
        }
      >
        <section>
          <h2 class="mb-3 text-heading text-ink">
            {t("EXPLORE_CHANNELS_TITLE")}
          </h2>
          <div {...listbox.list} class="flex flex-col gap-0.5">
            <For each={ranked()}>
              {(channel, index) => {
                const link = createChannelLink(
                  () => userFromSearch(channel),
                  () => open(channel),
                );
                return (
                  <button
                    type="button"
                    {...listbox.option(index)}
                    {...link.handlers}
                    onMouseMove={() => listbox.setActive(index())}
                    class={`flex items-center gap-3 h-14 rounded-sm px-3 text-left transition-colors duration-snap ${link.cursor}`}
                    classList={{ "bg-raised": listbox.active() === index() }}
                  >
                    <Avatar
                      src={channel.profileImageUrl}
                      alt={channel.user.displayName}
                      size={36}
                      presence={channel.isLive ? "live" : "offline"}
                    />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-body font-semibold text-ink">
                        {channel.user.displayName}
                      </p>
                      <p class="truncate text-small text-ink-soft">
                        <Show
                          when={channel.isLive}
                          fallback={t("EXPLORE_OFFLINE_STATUS")}
                        >
                          {liveLine(channel.gameName)}
                        </Show>
                      </p>
                    </div>
                    <Show when={channel.isLive}>
                      <LivePill />
                    </Show>
                    {link.menu()}
                  </button>
                );
              }}
            </For>
          </div>
        </section>
      </Show>
    </div>
  );
}
