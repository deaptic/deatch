import { Search, X } from "lucide-solid";
import { createMemo, Show } from "solid-js";
import Field from "../ui/Field.tsx";
import IconButton from "../ui/IconButton.tsx";
import LanguageSelect from "./LanguageSelect.tsx";
import { autofocus } from "../../lib/reactive/focus.ts";
import {
  comboboxFrom,
  type ListboxField,
} from "../../lib/reactive/createListbox.ts";
import { liveStreams } from "../../lib/stores/channels.ts";
import { liveBrowse } from "../../lib/stores/explore.ts";
import {
  exploreLanguage,
  setExploreLanguage,
} from "../../lib/stores/preferences.ts";
import { orderLanguages } from "../../lib/utils/languages.ts";
import { at } from "../../lib/utils/at.ts";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  query: string;
  onQuery: (value: string) => void;
  listbox: ListboxField | undefined;
};

const systemLanguage = () => at(navigator.language.split("-"), 0);

export default function ExploreBar(props: Props) {
  const combobox = comboboxFrom(() => props.listbox);

  const seenLanguages = createMemo<Set<string>>((prev) => {
    const next = new Set(prev);
    for (const s of liveStreams()) next.add(s.language);
    for (const s of liveBrowse.streams) next.add(s.language);
    return next.size === prev.size ? prev : next;
  }, new Set());

  const languageOptions = () =>
    orderLanguages(seenLanguages(), [systemLanguage(), exploreLanguage()]);

  return (
    <div class="sticky top-0 z-10 bg-canvas">
      <div class="mx-auto max-w-260 px-6 py-4 flex items-center gap-2">
        <Field
          size="lg"
          {...combobox}
          class="flex-1 min-w-0"
          icon={<Search />}
          ref={autofocus}
          value={props.query}
          onInput={(e) => props.onQuery(e.currentTarget.value)}
          placeholder={t("EXPLORE_SEARCH_PLACEHOLDER")}
          trailing={
            <Show when={props.query}>
              <IconButton
                label={t("EXPLORE_CLEAR_SEARCH_LABEL")}
                size="sm"
                onClick={() => props.onQuery("")}
              >
                <X class="size-4" />
              </IconButton>
            </Show>
          }
        />
        <LanguageSelect
          value={exploreLanguage()}
          options={languageOptions()}
          onChange={setExploreLanguage}
        />
      </div>
    </div>
  );
}
