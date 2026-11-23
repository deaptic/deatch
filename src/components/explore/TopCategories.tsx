import { createResource, Show } from "solid-js";
import { getTopCategories } from "../../platform/twitch/search.ts";
import { exploreFilters, setExploreFilters } from "../../lib/stores/explore.ts";
import CategoryRow from "./CategoryRow.tsx";
import { t } from "../../lib/i18n/index.ts";

const TOP_CATEGORY_COUNT = 20;

export default function TopCategories() {
  const [categories] = createResource(() =>
    getTopCategories(TOP_CATEGORY_COUNT, { silent: true }).catch(() => []),
  );

  return (
    <Show when={categories()?.length}>
      <section>
        <h2 class="mb-3 text-heading text-ink">
          {t("EXPLORE_TOP_CATEGORIES_TITLE")}
        </h2>
        <CategoryRow
          categories={categories() ?? []}
          selectedId={exploreFilters.category?.id}
          onSelect={(category) =>
            setExploreFilters("category", (current) =>
              current?.id === category.id ? null : category,
            )
          }
        />
      </section>
    </Show>
  );
}
