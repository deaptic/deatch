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
import Segmented from "../ui/Segmented.tsx";
import Skeleton from "../ui/Skeleton.tsx";

type Props = {
  onSelect: (channel: User) => void;
};

const PAGE_SIZE = 40;

type Scope = "following" | "all";

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
    <section>
      <div class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h2 class="text-heading text-ink">Live now</h2>
        <Show when={source().length > 0}>
          <span class="text-small text-ink-soft">
            {exploreFilters.followingOnly
              ? "from channels you follow"
              : "on Twitch"}
            {" · "}
            {source().length}
          </span>
        </Show>
        <Show when={exploreFilters.category}>
          {(category) => (
            <Chip
              label={category().name}
              selected
              onRemove={() => setExploreFilters("category", null)}
            />
          )}
        </Show>

        <div class="ml-auto flex items-center gap-2 self-center">
          <Segmented<Scope>
            value={exploreFilters.followingOnly ? "following" : "all"}
            options={[
              { value: "following", label: "Following" },
              { value: "all", label: "Everyone" },
            ]}
            onChange={(v) =>
              setExploreFilters("followingOnly", v === "following")}
          />
          <LanguageSelect
            value={exploreFilters.language}
            onChange={(v) => setExploreFilters("language", v)}
          />
        </div>
      </div>

      <Show
        when={!initialLoading()}
        fallback={
          <div class="grid grid-cards gap-4">
            <For each={Array.from({ length: 6 })}>
              {() => (
                <div class="flex flex-col gap-3">
                  <Skeleton shape="card" class="aspect-video" />
                  <div class="flex gap-3">
                    <Skeleton shape="circle" class="size-9 shrink-0" />
                    <div class="flex-1 flex flex-col gap-2 pt-1">
                      <Skeleton shape="line" class="h-3.5 w-32" />
                      <Skeleton shape="line" class="h-3 w-48" />
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        }
      >
        <Show
          when={sorted().length > 0}
          fallback={
            <p class="rounded-lg border border-dashed border-line px-4 py-10 text-center text-body text-ink-soft">
              <Show
                when={exploreFilters.followingOnly}
                fallback="No live channels match these filters right now."
              >
                Nobody you follow is live right now. Try "Everyone".
              </Show>
            </p>
          }
        >
          <div class="grid grid-cards gap-4">
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
          <p class="py-4 text-center text-small text-ink-soft">Loading more…</p>
        </Show>
      </Show>
    </section>
  );
}
