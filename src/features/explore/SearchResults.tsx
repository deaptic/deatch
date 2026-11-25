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
import type {
  Category,
  SearchChannel,
  User,
} from "../../shared/types/index.ts";
import {
  searchCategories,
  searchChannels,
} from "../../platform/twitch/search.ts";
import { users } from "../users/index.ts";
import { userFromSearch } from "../../shared/user.ts";
import {
  createListbox,
  type ListboxField,
} from "../../shared/solid/createListbox.ts";
import { LiveBadge, LivePill, rankChannels } from "../channels/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import { liveLine } from "../../shared/format/stream.ts";
import { createChannelLink } from "../menus/index.ts";
import CategoryRow from "./ui/CategoryRow.tsx";
import Avatar from "../../kit/Avatar.tsx";
import EmptyState from "../../kit/EmptyState.tsx";
import { t } from "../../shared/i18n/index.ts";
import SectionTitle from "../../kit/SectionTitle.tsx";
import OptionRow from "../../kit/OptionRow.tsx";
import Text from "../../kit/Text.tsx";

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
          <SectionTitle class="mb-3">
            {t("EXPLORE_CATEGORIES_TITLE")}
          </SectionTitle>
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
          <SectionTitle class="mb-3">
            {t("EXPLORE_CHANNELS_TITLE")}
          </SectionTitle>
          <div {...listbox.list} class="flex flex-col gap-0.5">
            <For each={ranked()}>
              {(channel, index) => {
                const link = createChannelLink(
                  () => userFromSearch(channel),
                  () => open(channel),
                );
                return (
                  <OptionRow
                    {...listbox.option(index)}
                    {...link.handlers}
                    onMouseMove={() => listbox.setActive(index())}
                    size="lg"
                    cursor={link.cursor}
                    active={listbox.active() === index()}
                  >
                    <Avatar
                      src={channel.profileImageUrl}
                      alt={channel.user.displayName}
                      size={36}
                    >
                      <LiveBadge live={channel.isLive} size="lg" />
                    </Avatar>
                    <div class="min-w-0 flex-1">
                      <Text as="p" truncate size="md" bold tone="primary">
                        {channel.user.displayName}
                      </Text>
                      <Text as="p" truncate size="sm" tone="soft">
                        <Show
                          when={channel.isLive}
                          fallback={t("EXPLORE_OFFLINE_STATUS")}
                        >
                          {liveLine(channel.gameName)}
                        </Show>
                      </Text>
                    </div>
                    <Show when={channel.isLive}>
                      <LivePill />
                    </Show>
                    {link.menu()}
                  </OptionRow>
                );
              }}
            </For>
          </div>
        </section>
      </Show>
    </div>
  );
}
