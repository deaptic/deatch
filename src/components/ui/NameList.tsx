import { createSignal, For, Match, Switch } from "solid-js";
import type { Person } from "../../lib/types/index.ts";
import { formatLocale } from "../../lib/i18n/index.ts";
import DisplayName from "./DisplayName.tsx";
import type { UserActions } from "./userLink.ts";

type Props = UserActions & {
  people: Person[];
  /// How many names show before the rest fold into `more`.
  limit: number;
  more: (count: number) => string;
};

/// People as the locale lists them ("a, b and 3 more"), each a name link;
/// the folded rest opens on click.
export default function NameList(props: Props) {
  const [expanded, setExpanded] = createSignal(false);
  const hidden = () =>
    expanded() ? 0 : Math.max(0, props.people.length - props.limit);
  const shown = () => props.people.slice(0, props.people.length - hidden());

  const parts = () => {
    const items = shown().map((p) => p.name);
    if (hidden()) items.push(props.more(hidden()));
    let element = 0;
    return new Intl.ListFormat(formatLocale())
      .formatToParts(items)
      .map((part) =>
        part.type === "element"
          ? { kind: "element" as const, index: element++, text: part.value }
          : { kind: "literal" as const, text: part.value },
      );
  };

  return (
    <For each={parts()}>
      {(part) => (
        <Switch fallback={part.text}>
          <Match when={part.kind === "element" && shown()[part.index]}>
            {(person) => (
              <DisplayName
                login={person().login}
                displayName={person().name}
                color={person().color}
                userId={person().id}
                onShowUserCard={props.onShowUserCard}
                onUserContextMenu={props.onUserContextMenu}
              />
            )}
          </Match>
          <Match when={part.kind === "element"}>
            <button
              type="button"
              class="hover:text-ink transition-colors duration-snap"
              onClick={() => setExpanded(true)}
            >
              {part.text}
            </button>
          </Match>
        </Switch>
      )}
    </For>
  );
}
