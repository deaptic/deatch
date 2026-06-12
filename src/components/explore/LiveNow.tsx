import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js";
import type { User } from "../../lib/types/twitch/user.ts";
import type { Stream } from "../../lib/types/twitch/stream.ts";
import { liveStreams, rememberUser } from "../../lib/stores/channels.ts";
import { exploreFilters, setExploreFilters } from "../../lib/stores/explore.ts";
import { getStreams } from "../../lib/api/twitch/streams.ts";
import { getUsers } from "../../lib/api/twitch/users.ts";
import LiveCard from "./LiveCard.tsx";
import LanguageSelect from "./LanguageSelect.tsx";
import Chip from "../ui/Chip.tsx";

type Props = {
  onSelect: (channel: User) => void;
};

const PAGE_SIZE = 40;

export default function LiveNow(props: Props) {
  const [remote, setRemote] = createSignal<Stream[]>([]);
  const [cursor, setCursor] = createSignal<string | null>(null);
  const [fetching, setFetching] = createSignal(false);
  const [exhausted, setExhausted] = createSignal(false);

  async function fetchPage(reset: boolean) {
    if (exploreFilters.followingOnly || fetching()) return;
    if (!reset && exhausted()) return;
    setFetching(true);
    try {
      const { data, pagination } = await getStreams({
        gameIds: exploreFilters.category
          ? [exploreFilters.category.id]
          : undefined,
        language: exploreFilters.language || undefined,
        first: PAGE_SIZE,
        after: reset ? undefined : cursor() ?? undefined,
      });
      if (data.length) {
        getUsers({ ids: data.map((s) => s.user.id) })
          .then((users) => users.forEach(rememberUser))
          .catch(() => {});
      }
      setRemote((prev) => (reset ? data : [...prev, ...data]));
      setCursor(pagination.cursor);
      setExhausted(!pagination.cursor || data.length === 0);
    } catch {
      setExhausted(true);
    } finally {
      setFetching(false);
    }
  }

  createEffect(
    on(
      () => [
        exploreFilters.followingOnly,
        exploreFilters.language,
        exploreFilters.category,
      ],
      () => {
        setRemote([]);
        setCursor(null);
        setExhausted(false);
        if (!exploreFilters.followingOnly) fetchPage(true);
      },
    ),
  );

  const source = () => {
    if (!exploreFilters.followingOnly) return remote();
    const lang = exploreFilters.language;
    const category = exploreFilters.category;
    return liveStreams().filter((s) =>
      (!lang || s.language === lang) && (!category || s.game.id === category.id)
    );
  };

  const sorted = () =>
    [...source()].sort((a, b) => b.viewerCount - a.viewerCount);

  const initialLoading = () =>
    !exploreFilters.followingOnly && fetching() && remote().length === 0;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) fetchPage(false);
    },
    { rootMargin: "400px" },
  );
  onCleanup(() => observer.disconnect());

  return (
    <section class="mb-8">
      <div class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-text">
          Live now
        </h2>
        <Show when={source().length > 0}>
          <span class="rounded-full bg-bg px-2 py-0.5 text-xs text-text-muted">
            {source().length}
          </span>
        </Show>
        <Show when={exploreFilters.category}>
          {(category) => (
            <Chip
              label={category().name}
              onRemove={() => setExploreFilters("category", null)}
            />
          )}
        </Show>

        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExploreFilters("followingOnly", (v) => !v)}
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            classList={{
              "bg-bg-light text-text": exploreFilters.followingOnly,
              "text-text-muted hover:text-text": !exploreFilters.followingOnly,
            }}
          >
            Following
          </button>
          <LanguageSelect
            value={exploreFilters.language}
            onChange={(v) => setExploreFilters("language", v)}
          />
        </div>
      </div>

      <Show
        when={!initialLoading()}
        fallback={
          <p class="rounded-lg border border-dashed border-border-muted px-4 py-8 text-center text-sm text-text-muted">
            Loading streams…
          </p>
        }
      >
        <Show
          when={sorted().length > 0}
          fallback={
            <p class="rounded-lg border border-dashed border-border-muted px-4 py-8 text-center text-sm text-text-muted">
              <Show
                when={exploreFilters.followingOnly}
                fallback="No live channels match these filters right now."
              >
                None of the channels you follow are live right now.
              </Show>
            </p>
          }
        >
          <div class="grid auto-rows-fr grid-cols-1 gap-x-4 gap-y-6 @[440px]:grid-cols-2 @[820px]:grid-cols-3 @[1180px]:grid-cols-4">
            <For each={sorted()}>
              {(stream) => (
                <LiveCard stream={stream} onSelect={props.onSelect} />
              )}
            </For>
          </div>
        </Show>

        <div ref={(el) => observer.observe(el)} class="h-px" />
        <Show
          when={!exploreFilters.followingOnly && fetching() &&
            remote().length > 0}
        >
          <p class="py-4 text-center text-sm text-text-muted">Loading more…</p>
        </Show>
      </Show>
    </section>
  );
}
