import { createResource, Show } from "solid-js";
import { getTopCategories } from "../../platform/twitch/search.ts";
import { filters, toggleCategory } from "./store.ts";
import CategoryRow from "./ui/CategoryRow.tsx";
import { t } from "../../shared/i18n/index.ts";

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
          selectedId={filters.category?.id}
          onSelect={toggleCategory}
        />
      </section>
    </Show>
  );
}
