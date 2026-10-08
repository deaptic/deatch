import { Heart } from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import type { User } from "../../lib/types/index.ts";
import type { Stream } from "../../lib/types/index.ts";
import { liveStreams } from "../../lib/stores/channels.ts";
import { exploreFilters, setExploreFilters } from "../../lib/stores/explore.ts";
import {
  exploreLanguage,
  setExploreLanguage,
} from "../../lib/stores/preferences.ts";
import { getStreams } from "../../lib/api/twitch/streams.ts";
import * as users from "../../lib/services/users.ts";
import { orderLanguages } from "../../lib/utils/languages.ts";
import LiveCard from "./LiveCard.tsx";
import LanguageSelect from "./LanguageSelect.tsx";
import Chip from "../ui/Chip.tsx";
import Button from "../ui/Button.tsx";
import Skeleton from "../ui/Skeleton.tsx";

type Props = {
  onSelect: (channel: User) => void;
};

const PAGE_SIZE = 40;
const THUMBNAIL_REFRESH_MS = 5 * 60_000;
const SYSTEM_LANGUAGE = navigator.language.split("-")[0];

export default function LiveNow(props: Props) {
  const [remote, setRemote] = createSignal<Stream[]>([]);
  const [cursor, setCursor] = createSignal<string | null>(null);
  const [fetching, setFetching] = createSignal(false);
  const [exhausted, setExhausted] = createSignal(false);
  const [thumbnailVersion, setThumbnailVersion] = createSignal(0);

  onMount(() => {
    const id = setInterval(
      () => setThumbnailVersion((v) => v + 1),
      THUMBNAIL_REFRESH_MS,
    );
    onCleanup(() => clearInterval(id));
  });

  // A filter change starts a new generation; pages from the old one are
  // dropped when they land.
  let generation = 0;

  async function fetchPage(reset: boolean) {
    if (exploreFilters.followingOnly) return;
    if (!reset && (fetching() || exhausted())) return;
    const mine = ++generation;
    setFetching(true);
    try {
      const { data, pagination } = await getStreams({
        gameIds: exploreFilters.category
          ? [exploreFilters.category.id]
          : undefined,
        language: exploreLanguage() || undefined,
        first: PAGE_SIZE,
        after: reset ? undefined : cursor() ?? undefined,
      });
      if (mine !== generation) return;
      if (data.length) {
        users.get(data.map((s) => s.user.id)).catch(() => {});
      }
      setRemote((prev) => (reset ? data : [...prev, ...data]));
      setCursor(pagination.cursor);
      setExhausted(!pagination.cursor || data.length === 0);
    } catch {
      if (mine === generation) setExhausted(true);
    } finally {
      if (mine === generation) setFetching(false);
    }
  }

  createEffect(
    on(
      () => [
        exploreFilters.followingOnly,
        exploreLanguage(),
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
    const lang = exploreLanguage();
    const category = exploreFilters.category;
    return liveStreams().filter((s) =>
      (!lang || s.language === lang) && (!category || s.game.id === category.id)
    );
  };

  const sorted = () =>
    [...source()].sort((a, b) => b.viewerCount - a.viewerCount);

  const seenLanguages = createMemo<Set<string>>((prev) => {
    const next = new Set(prev);
    for (const s of liveStreams()) next.add(s.language);
    for (const s of remote()) next.add(s.language);
    return next.size === prev.size ? prev : next;
  }, new Set());

  const languageOptions = () =>
    orderLanguages(seenLanguages(), [SYSTEM_LANGUAGE, exploreLanguage()]);

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
      <div class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div class="grow flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h2 class="text-heading text-ink">Live now</h2>
          <Show when={exploreFilters.category}>
            {(category) => (
              <Chip
                label={category().name}
                selected
                onRemove={() => setExploreFilters("category", null)}
              />
            )}
          </Show>
        </div>

        <div class="flex items-center gap-2">
          <Button
            variant="neutral"
            size="sm"
            icon={<Heart class="size-4" />}
            pressed={exploreFilters.followingOnly}
            onClick={() => setExploreFilters("followingOnly", (v) => !v)}
          >
            Following
          </Button>
          <LanguageSelect
            value={exploreLanguage()}
            options={languageOptions()}
            onChange={setExploreLanguage}
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
                <LiveCard
                  stream={stream}
                  thumbnailVersion={thumbnailVersion()}
                  onSelect={props.onSelect}
                />
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
