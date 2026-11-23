import { For } from "solid-js";
import type { Person } from "../../shared/types/index.ts";
import { splitNames } from "./splitNames.ts";
import DisplayName from "./DisplayName.tsx";
import type { UserActions } from "./userLink.ts";
import { at } from "../../shared/at.ts";

type Props = UserActions & { text: string; people: Person[] };

export default function TextWithMentions(props: Props) {
  return (
    <For
      each={splitNames(
        props.text,
        props.people.map((p) => p.name),
      )}
    >
      {(segment) => {
        if (!("person" in segment)) return segment.text;
        const person = at(props.people, segment.person);
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
