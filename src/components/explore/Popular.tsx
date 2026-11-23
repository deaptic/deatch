import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { User } from "../../lib/types/index.ts";
import {
  exploreFilters,
  liveBrowse,
  setExploreFilters,
} from "../../lib/stores/explore.ts";
import * as explore from "../../lib/services/explore.ts";
import { sortStreams } from "../../lib/utils/liveFilter.ts";
import LiveCard from "./LiveCard.tsx";
import Chip from "../ui/Chip.tsx";
import EmptyState from "../ui/EmptyState.tsx";
import Skeleton from "../ui/Skeleton.tsx";
import Segmented from "../ui/Segmented.tsx";
import { moveGridFocus } from "../ui/gridKeys.ts";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  onSelect: (channel: User) => void;
};

const THUMBNAIL_REFRESH_MS = 5 * 60_000;
const SKELETON_CARDS = 6;

export default function Popular(props: Props) {
  const [thumbnailVersion, setThumbnailVersion] = createSignal(0);

  onMount(() => {
    const id = setInterval(
      () => setThumbnailVersion((v) => v + 1),
      THUMBNAIL_REFRESH_MS,
    );
    onCleanup(() => clearInterval(id));
    onCleanup(explore.watch());
  });

  const sorted = () => sortStreams(liveBrowse.streams, exploreFilters.sort);
  const initialLoading = () =>
    liveBrowse.fetching && liveBrowse.streams.length === 0;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) explore.loadMore();
    },
    { rootMargin: "400px" },
  );
  onCleanup(() => observer.disconnect());

  return (
    <section>
      <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 class="text-heading text-ink">{t("EXPLORE_POPULAR_TITLE")}</h2>
        <Show when={exploreFilters.category}>
          {(category) => (
            <Chip
              label={category().name}
              selected
              onRemove={() => setExploreFilters("category", null)}
            />
          )}
        </Show>
        <span class="ml-auto">
          <Segmented
            label={t("EXPLORE_SORT_LABEL")}
            value={exploreFilters.sort}
            options={[
              { value: "viewers", label: t("EXPLORE_SORT_VIEWERS_LABEL") },
              { value: "recent", label: t("EXPLORE_SORT_RECENT_LABEL") },
            ]}
            onChange={(sort) => setExploreFilters("sort", sort)}
          />
        </span>
      </div>

      <Show
        when={!initialLoading()}
        fallback={
          <div class="grid grid-cards gap-4">
            <For each={Array.from({ length: SKELETON_CARDS })}>
              {() => (
                <div class="flex flex-col gap-3">
                  <Skeleton shape="card" class="aspect-video" />
                  <div class="flex gap-3 px-1">
                    <Skeleton shape="circle" class="size-9 shrink-0" />
                    <div class="flex-1 flex flex-col gap-2 pt-1">
                      <Skeleton shape="line" class="h-3.5 w-4/5" />
                      <Skeleton shape="line" class="h-3 w-1/2" />
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
            <EmptyState variant="inline" body={t("EXPLORE_NO_MATCHES_EMPTY")} />
          }
        >
          <div
            onKeyDown={moveGridFocus}
            class="grid grid-cards gap-4 enter-stagger"
          >
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
        <Show when={liveBrowse.fetching && liveBrowse.streams.length > 0}>
          <p class="py-4 text-center text-small text-ink-soft">
            {t("EXPLORE_LOADING_MORE_STATUS")}
          </p>
        </Show>
      </Show>
    </section>
  );
}
