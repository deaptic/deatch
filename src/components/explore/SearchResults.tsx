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

  const matchRank = (value: string, q: string) => {
    const v = value.toLowerCase();
    if (v === q) return 0;
    if (v.startsWith(q)) return 1;
    if (v.includes(q)) return 2;
    return 3;
  };

  const ranked = () => {
    const q = debounced().toLowerCase();
    return [...(results() ?? [])].sort((a, b) => {
      const ra = Math.min(
        matchRank(a.user.login, q),
        matchRank(a.user.displayName, q),
      );
      const rb = Math.min(
        matchRank(b.user.login, q),
        matchRank(b.user.displayName, q),
      );
      if (ra !== rb) return ra - rb;
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return 0;
    });
  };

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
    <div class="flex flex-col gap-6">
      <Show when={categories()?.length}>
        <div>
          <p class="mb-2.5 text-sm font-semibold uppercase tracking-wide text-text">
            Games
          </p>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <For each={categories()}>
              {(category) => (
                <button
                  type="button"
                  onClick={() => props.onSelectGame(category)}
                  class="group w-[92px] shrink-0 text-left"
                >
                  <img
                    src={category.boxArtUrl}
                    alt={category.name}
                    loading="lazy"
                    class="aspect-[3/4] w-full rounded-md bg-bg-light object-cover transition group-hover:opacity-80"
                  />
                  <p class="mt-1.5 truncate text-xs font-medium text-text">
                    {category.name}
                  </p>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show
        when={ranked().length}
        fallback={
          <Show when={!categories()?.length}>
            <p class="rounded-lg border border-dashed border-border-muted px-4 py-8 text-center text-sm text-text-muted">
              <Show
                when={!results.loading && !categories.loading}
                fallback="Searching…"
              >
                No results for “{debounced()}”.
              </Show>
            </p>
          </Show>
        }
      >
        <div>
          <p class="mb-2.5 text-sm font-semibold uppercase tracking-wide text-text">
            Channels
          </p>
          <div class="flex flex-col gap-1">
            <For each={ranked()}>
              {(channel, index) => (
                <button
                  type="button"
                  ref={(el) => (rows[index()] = el)}
                  onClick={() => open(channel)}
                  onMouseMove={() => setActive(index())}
                  class="flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
                  classList={{
                    "bg-bg-light": active() === index(),
                    "hover:bg-bg": active() !== index(),
                  }}
                >
                  <Avatar
                    src={channel.profileImageUrl}
                    alt={channel.user.displayName}
                    class="size-10 shrink-0 rounded-lg"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-text">
                      {channel.user.displayName}
                    </p>
                    <Show
                      when={channel.isLive}
                      fallback={
                        <p class="truncate text-xs text-text-muted">Offline</p>
                      }
                    >
                      <p class="flex items-center gap-1.5 truncate text-xs text-success">
                        <span class="size-1.5 shrink-0 rounded-full bg-success" />
                        <span class="shrink-0">Live</span>
                        <Show when={channel.gameName}>
                          <span class="truncate text-text-muted">
                            · {channel.gameName}
                          </span>
                        </Show>
                      </p>
                    </Show>
                  </div>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
