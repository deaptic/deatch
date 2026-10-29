import { Heart } from "lucide-solid";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import type { User } from "../../lib/types/index.ts";
import { liveStreams } from "../../lib/stores/channels.ts";
import {
  exploreFilters,
  liveBrowse,
  setExploreFilters,
} from "../../lib/stores/explore.ts";
import {
  exploreLanguage,
  setExploreLanguage,
} from "../../lib/stores/preferences.ts";
import * as explore from "../../lib/services/explore.ts";
import { byViewers, matchingStreams } from "../../lib/utils/liveFilter.ts";
import { orderLanguages } from "../../lib/utils/languages.ts";
import LiveCard from "./LiveCard.tsx";
import LanguageSelect from "./LanguageSelect.tsx";
import Chip from "../ui/Chip.tsx";
import EmptyState from "../ui/EmptyState.tsx";
import Button from "../ui/Button.tsx";
import Skeleton from "../ui/Skeleton.tsx";
import { t } from "../../lib/i18n/index.ts";
import { at } from "../../lib/utils/at.ts";

type Props = {
  onSelect: (channel: User) => void;
};

const THUMBNAIL_REFRESH_MS = 5 * 60_000;
const systemLanguage = () => at(navigator.language.split("-"), 0);

export default function LiveNow(props: Props) {
  const [thumbnailVersion, setThumbnailVersion] = createSignal(0);

  onMount(() => {
    const id = setInterval(
      () => setThumbnailVersion((v) => v + 1),
      THUMBNAIL_REFRESH_MS,
    );
    onCleanup(() => clearInterval(id));
    onCleanup(explore.watch());
  });

  const sorted = () =>
    byViewers(
      exploreFilters.followingOnly
        ? matchingStreams(
            liveStreams(),
            exploreLanguage(),
            exploreFilters.category,
          )
        : liveBrowse.streams,
    );

  const seenLanguages = createMemo<Set<string>>((prev) => {
    const next = new Set(prev);
    for (const s of liveStreams()) next.add(s.language);
    for (const s of liveBrowse.streams) next.add(s.language);
    return next.size === prev.size ? prev : next;
  }, new Set());

  const languageOptions = () =>
    orderLanguages(seenLanguages(), [systemLanguage(), exploreLanguage()]);

  const initialLoading = () =>
    !exploreFilters.followingOnly &&
    liveBrowse.fetching &&
    liveBrowse.streams.length === 0;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) explore.loadMore();
    },
    { rootMargin: "400px" },
  );
  onCleanup(() => observer.disconnect());

  return (
    <section>
      <div class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div class="grow flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h2 class="text-heading text-ink">{t("EXPLORE_LIVE_NOW")}</h2>
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
            {t("EXPLORE_FOLLOWING")}
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
            <EmptyState
              variant="inline"
              body={
                exploreFilters.followingOnly
                  ? t("EXPLORE_NONE_LIVE")
                  : t("EXPLORE_NO_MATCHES")
              }
            />
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
          when={
            !exploreFilters.followingOnly &&
            liveBrowse.fetching &&
            liveBrowse.streams.length > 0
          }
        >
          <p class="py-4 text-center text-small text-ink-soft">
            {t("EXPLORE_LOADING_MORE")}
          </p>
        </Show>
      </Show>
    </section>
  );
}
