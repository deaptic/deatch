import { For } from "solid-js";
import type { Person } from "../../lib/types/index.ts";
import { splitNames } from "../../lib/utils/splitNames.ts";
import DisplayName from "./DisplayName.tsx";
import type { UserActions } from "./userLink.ts";

type Props = UserActions & { text: string; people: Person[] };

/// A sentence with every person it names shown as a name link.
export default function NamedText(props: Props) {
  return (
    <For
      each={splitNames(
        props.text,
        props.people.map((p) => p.name),
      )}
    >
      {(segment) => {
        if (!("person" in segment)) return segment.text;
        const person = props.people[segment.person];
        return (
          <DisplayName
            login={person.login}
            displayName={segment.text}
            color={person.color}
            userId={person.id}
            onShowUserCard={props.onShowUserCard}
            onUserContextMenu={props.onUserContextMenu}
          />
        );
      }}
    </For>
  );
}
