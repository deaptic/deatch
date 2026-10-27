import { For, type JSX, Show } from "solid-js";
import type { Fragment, Person } from "../../../lib/types/index.ts";
import type { EmoteMap } from "../../../lib/stores/emotes.ts";
import type { CheermoteMap } from "../../../lib/utils/cheermote.ts";
import DisplayName from "../../ui/DisplayName.tsx";
import type { UserActions } from "../../ui/userLink.ts";
import Fragments from "../../ui/Fragments.tsx";
import { splitNames } from "../../../lib/utils/splitNames.ts";
import GiftRecipients from "./GiftRecipients.tsx";

type Props = UserActions & {
  /// One sentence: what happened.
  text: string;
  /// Everyone the text names, each shown as a link.
  people: Person[];
  /// Whoever wrote `words`.
  speaker?: Person;
  words?: Fragment[];
  detail?: string;
  recipients?: Person[];
  lead?: JSX.Element;
  trail?: JSX.Element;
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
};

/// Every feed notice: the headline, then the chatter's words as chat writes
/// them, then a quieter line for anything else.
export default function Notice(props: Props) {
  const name = (person: Person, shown = person.name) => (
    <DisplayName
      login={person.login}
      displayName={shown}
      color={person.color}
      userId={person.id}
      onShowUserCard={props.onShowUserCard}
      onUserContextMenu={props.onUserContextMenu}
    />
  );

  const segments = () =>
    splitNames(props.text, props.people.map((p) => p.name));

  return (
    <span class="text-ink">
      {props.lead}
      <For each={segments()}>
        {(segment) =>
          "person" in segment
            ? name(props.people[segment.person], segment.text)
            : segment.text}
      </For>
      {props.trail}
      <Show when={props.words}>
        {(words) => (
          <span class="block">
            <Show when={props.speaker}>
              {(speaker) => (
                <>
                  {name(speaker())}
                  <span class="text-ink-soft">:</span>
                  {" "}
                </>
              )}
            </Show>
            <Fragments
              fragments={words()}
              emotes={props.emotes}
              cheermotes={props.cheermotes}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
          </span>
        )}
      </Show>
      <Show when={props.detail}>
        {(detail) => <span class="block text-ink-soft">{detail()}</span>}
      </Show>
      <Show when={props.recipients?.length ? props.recipients : undefined}>
        {(recipients) => (
          <GiftRecipients
            recipients={recipients()}
            onShowUserCard={props.onShowUserCard}
            onUserContextMenu={props.onUserContextMenu}
          />
        )}
      </Show>
    </span>
  );
}
