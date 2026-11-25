import { createResource, Show } from "solid-js";
import { getTopCategories } from "../../platform/twitch/search.ts";
import { filters, toggleCategory } from "./store.ts";
import CategoryRow from "./ui/CategoryRow.tsx";
import { t } from "../../shared/i18n/index.ts";
import SectionTitle from "../../kit/SectionTitle.tsx";

const TOP_CATEGORY_COUNT = 20;

export default function TopCategories() {
  const [categories] = createResource(() =>
    getTopCategories(TOP_CATEGORY_COUNT, { silent: true }).catch(() => []),
  );

  return (
    <Show when={categories()?.length}>
      <section>
        <SectionTitle class="mb-3">
          {t("EXPLORE_TOP_CATEGORIES_TITLE")}
        </SectionTitle>
        <CategoryRow
          categories={categories() ?? []}
          selectedId={filters.category?.id}
          onSelect={toggleCategory}
        />
      </section>
    </Show>
  );
}
