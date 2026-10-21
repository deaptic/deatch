import { Search, X } from "lucide-solid";
import { Show } from "solid-js";
import Field from "../ui/Field.tsx";
import IconButton from "../ui/IconButton.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  value: string;
  onInput: (value: string) => void;
};

export default function ExploreSearch(props: Props) {
  return (
    <Field
      size="lg"
      class="w-full mb-8"
      icon={<Search />}
      ref={(el) => queueMicrotask(() => el.focus())}
      value={props.value}
      onInput={(e) => props.onInput(e.currentTarget.value)}
      placeholder={t("EXPLORE_SEARCH_PLACEHOLDER")}
      trailing={
        <Show when={props.value}>
          <IconButton
            label={t("EXPLORE_CLEAR_SEARCH")}
            size="sm"
            onClick={() => props.onInput("")}
          >
            <X class="size-4" />
          </IconButton>
        </Show>
      }
    />
  );
}
