import { Search } from "lucide-solid";
import { createSignal, For, type JSX, onCleanup, Show } from "solid-js";
import { createListbox } from "../shared/solid/createListbox.ts";
import { autofocus } from "../shared/solid/focus.ts";
import Field from "./Field.tsx";
import OptionRow from "./OptionRow.tsx";

const SEARCH_DELAY_MS = 250;

type Props<T> = {
  label: string;
  placeholder: string;
  initial?: string;
  search: (query: string) => Promise<T[]>;
  name: (item: T) => string;
  picture: (item: T) => JSX.Element;
  onSelect: (item: T | null) => void;
  autofocus?: boolean;
  floating?: boolean;
  clearOnSelect?: boolean;
};

export default function SearchPicker<T>(props: Props<T>) {
  const [query, setQuery] = createSignal(props.initial ?? "");
  const [results, setResults] = createSignal<T[]>([]);
  const { active, setActive, move, ...listbox } = createListbox({
    count: () => results().length,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest = 0;
  onCleanup(() => clearTimeout(timer));

  function type(value: string) {
    setQuery(value);
    props.onSelect(null);
    clearTimeout(timer);
    const q = value.trim();
    if (!q) return setResults([]);
    const request = ++latest;
    timer = setTimeout(() => {
      props
        .search(q)
        .then((found) => {
          if (request !== latest) return;
          setResults(found);
          setActive(0);
        })
        .catch(() => {});
    }, SEARCH_DELAY_MS);
  }

  function pick(item: T) {
    latest++;
    setQuery(props.clearOnSelect ? "" : props.name(item));
    setResults([]);
    props.onSelect(item);
  }

  return (
    <div class="relative flex flex-col gap-1">
      <Field
        ref={props.autofocus ? autofocus : undefined}
        icon={<Search />}
        aria-label={props.label}
        placeholder={props.placeholder}
        {...listbox.field}
        value={query()}
        onInput={(e) => type(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (results().length === 0) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            move(e.key === "ArrowDown" ? 1 : -1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const item = results()[active()];
            if (item !== undefined) pick(item);
          }
        }}
      />
      <Show when={results().length > 0}>
        <div
          {...listbox.list}
          class={`max-h-60 overflow-y-auto p-1 flex flex-col ${
            props.floating
              ? "absolute top-full inset-x-0 mt-1 z-30 material-regular rounded-md enter-pop origin-top"
              : "rounded-sm"
          }`}
        >
          <For each={results()}>
            {(item, i) => (
              <OptionRow
                {...listbox.option(i)}
                active={i() === active()}
                onMouseEnter={() => setActive(i())}
                onClick={() => pick(item)}
              >
                {props.picture(item)}
                <span class="truncate">{props.name(item)}</span>
              </OptionRow>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
