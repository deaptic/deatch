import { For, Show } from "solid-js";
import type { Notes as ReleaseNotes } from "../../shared/changelog.ts";
import Text from "../../kit/Text.tsx";
import NotesGroup from "./NotesGroup.tsx";

export default function Notes(props: { notes: ReleaseNotes }) {
  return (
    <div class="flex flex-col gap-4">
      <Show when={props.notes.summary}>
        <Text as="p" size="md" bold>
          {props.notes.summary}
        </Text>
      </Show>
      <div class="flex flex-col gap-6">
        <For each={props.notes.groups}>
          {(group) => <NotesGroup group={group} />}
        </For>
      </div>
    </div>
  );
}
