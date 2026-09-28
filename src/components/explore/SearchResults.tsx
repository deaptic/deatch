import {
  createEffect,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import type { User } from "../../lib/types/twitch/user.ts";
import {
  type Category,
  searchCategories,
  type SearchChannel,
  searchChannels,
} from "../../lib/api/twitch/search.ts";
import { getUsers } from "../../lib/api/twitch/users.ts";
import { rememberUser } from "../../lib/stores/channels.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import Avatar from "../ui/Avatar.tsx";
import LivePill from "../ui/LivePill.tsx";

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

  const [results] = createResource(
    debounced,
    (q) => (q ? searchChannels({ query: q, first: 24 }) : []),
  );

  const [categories] = createResource(
    debounced,
    (q) => (q ? searchCategories({ query: q, first: 8 }) : []),
  );

  const ranked = () => results() ?? [];

  function open(channel: SearchChannel) {
    const user: User = {
      id: channel.user.id,
      login: channel.user.login,
      displayName: channel.user.displayName,
      profileImageUrl: channel.profileImageUrl,
      description: "",
      broadcasterType: "",
      createdAt: "",
    };
    rememberUser(user);
    props.onSelect(user);
  }

  async function forceOpenByLogin() {
    const login = debounced().toLowerCase();
    if (!login) return;
    try {
      const users = await getUsers({ logins: [login] });
      const channel = users[0];
      if (!channel) {
        addToast("Channel not found", "error");
        return;
      }
      rememberUser(channel);
      props.onSelect(channel);
    } catch (e) {
      addToast(String(e), "error");
    }
  }

  const [active, setActive] = createSignal(-1);
  const rows: HTMLButtonElement[] = [];

  createEffect(() => {
    ranked();
    setActive(-1);
  });

  createEffect(() => {
    if (active() >= 0) rows[active()]?.scrollIntoView({ block: "nearest" });
  });

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, ranked().length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const channel = ranked()[active()];
        if (channel) open(channel);
        else forceOpenByLogin();
      }
    };
    globalThis.addEventListener("keydown", onKey);
    onCleanup(() => globalThis.removeEventListener("keydown", onKey));
  });

  return (
    <div class="flex flex-col gap-8">
      <Show when={categories()?.length}>
        <section>
          <h2 class="mb-3 text-heading text-ink">Categories</h2>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <For each={categories()}>
              {(category) => (
                <button
                  type="button"
                  onClick={() => props.onSelectGame(category)}
                  class="group w-24 shrink-0 text-left cursor-pointer"
                >
                  <img
                    src={category.boxArtUrl}
                    alt={category.name}
                    loading="lazy"
                    class="aspect-3/4 w-full rounded-md bg-raised object-cover transition-opacity duration-snap group-hover:opacity-80"
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
                fallback="Searching…"
              >
                No results for “{debounced()}”. Press Enter to open it by name
                anyway.
              </Show>
            </p>
          </Show>
        }
      >
        <section>
          <h2 class="mb-3 text-heading text-ink">Channels</h2>
          <div class="flex flex-col gap-0.5">
            <For each={ranked()}>
              {(channel, index) => (
                <button
                  type="button"
                  ref={(el) => (rows[index()] = el)}
                  onClick={() => open(channel)}
                  onMouseMove={() => setActive(index())}
                  class="flex items-center gap-3 h-14 rounded-sm px-3 text-left cursor-pointer transition-colors duration-snap"
                  classList={{
                    "bg-raised": active() === index(),
                    "hover:bg-surface": active() !== index(),
                  }}
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
                      <Show when={channel.isLive} fallback="Offline">
                        Live
                        <Show when={channel.gameName}>
                          {` · ${channel.gameName}`}
                        </Show>
                      </Show>
                    </p>
                  </div>
                  <Show when={channel.isLive}>
                    <LivePill />
                  </Show>
                </button>
              )}
            </For>
          </div>
        </section>
      </Show>
    </div>
  );
}
