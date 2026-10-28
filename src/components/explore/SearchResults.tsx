import {
  createEffect,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import type { Category, SearchChannel, User } from "../../lib/types/index.ts";
import {
  searchCategories,
  searchChannels,
} from "../../lib/api/twitch/search.ts";
import * as users from "../../lib/services/users.ts";
import { createListNavigation } from "../../lib/reactive/createListNavigation.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import Artwork from "../ui/Artwork.tsx";
import Avatar from "../ui/Avatar.tsx";
import LivePill from "../ui/LivePill.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  query: string;
  onSelect: (channel: User) => void;
  onSelectGame: (game: Category) => void;
};

export default function SearchResults(props: Props) {
  const [debounced, setDebounced] = createSignal(props.query.trim());

  createEffect(() => {
    const q = props.query.trim();
    const timer = setTimeout(() => setDebounced(q), 300);
    onCleanup(() => clearTimeout(timer));
  });

  const [results] = createResource(debounced, (q) =>
    q ? searchChannels({ query: q, first: 24 }).catch(() => []) : [],
  );

  const [categories] = createResource(debounced, (q) =>
    q ? searchCategories({ query: q, first: 8 }).catch(() => []) : [],
  );

  const ranked = () => results() ?? [];

  const toUser = (channel: SearchChannel): User => ({
    id: channel.user.id,
    login: channel.user.login,
    displayName: channel.user.displayName,
    profileImageUrl: channel.profileImageUrl,
    offlineImageUrl: null,
    description: "",
    broadcasterType: "normal",
    createdAt: "",
  });

  function open(channel: SearchChannel) {
    const user = toUser(channel);
    users.set([user]);
    props.onSelect(user);
  }

  async function forceOpenByLogin() {
    const login = props.query.trim().toLowerCase();
    if (!login) return;
    const lookup = await users.findByLogin(login);
    if (lookup.status === "missing") {
      addToast(t("COMMON_CHANNEL_NOT_FOUND"), "error");
    } else if (lookup.status === "found") {
      props.onSelect(lookup.user);
    }
  }

  const rows: HTMLButtonElement[] = [];
  const { active, setActive, move } = createListNavigation({
    count: () => ranked().length,
    rowAt: (i) => rows[i],
  });

  createEffect(() => {
    ranked();
    setActive(0);
  });

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        move(e.key === "ArrowDown" ? 1 : -1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const channel = ranked()[active()];
        if (channel) open(channel);
        else void forceOpenByLogin();
      }
    };
    globalThis.addEventListener("keydown", onKey);
    onCleanup(() => globalThis.removeEventListener("keydown", onKey));
  });

  return (
    <div class="flex flex-col gap-8">
      <Show when={categories()?.length}>
        <section>
          <h2 class="mb-3 text-heading text-ink">{t("EXPLORE_CATEGORIES")}</h2>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <For each={categories()}>
              {(category) => (
                <button
                  type="button"
                  onClick={() => props.onSelectGame(category)}
                  class="group w-24 shrink-0 text-left cursor-pointer"
                >
                  <Artwork
                    src={category.boxArtUrl}
                    alt={category.name}
                    shape="boxart"
                    fit="fill"
                    interactive
                  />
                  <p class="mt-1.5 truncate text-small text-ink">
                    {category.name}
                  </p>
                </button>
              )}
            </For>
          </div>
        </section>
      </Show>

      <Show
        when={ranked().length}
        fallback={
          <Show when={!categories()?.length}>
            <p class="rounded-lg border border-dashed border-line px-4 py-10 text-center text-body text-ink-soft">
              <Show
                when={!results.loading && !categories.loading}
                fallback={t("COMMON_SEARCHING")}
              >
                {t("EXPLORE_NO_RESULTS", { query: debounced() })}
              </Show>
            </p>
          </Show>
        }
      >
        <section>
          <h2 class="mb-3 text-heading text-ink">{t("EXPLORE_CHANNELS")}</h2>
          <div class="flex flex-col gap-0.5">
            <For each={ranked()}>
              {(channel, index) => {
                const link = createChannelLink(
                  () => toUser(channel),
                  () => open(channel),
                );
                return (
                  <button
                    type="button"
                    ref={(el) => (rows[index()] = el)}
                    {...link.handlers}
                    onMouseMove={() => setActive(index())}
                    class={`flex items-center gap-3 h-14 rounded-sm px-3 text-left transition-colors duration-snap ${link.cursor}`}
                    classList={{ "bg-raised": active() === index() }}
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
                          fallback={t("COMMON_OFFLINE")}
                        >
                          {t("COMMON_LIVE")}
                          <Show when={channel.gameName}>
                            {` · ${channel.gameName}`}
                          </Show>
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
