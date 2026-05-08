import { For } from "solid-js";
import { EmoteSection } from "../emotes";
import { EmoteGrid, PickerSection } from "./EmoteGrid";

export default function EmoteSections(props: {
  sections: EmoteSection[];
  onSelect: (name: string) => void;
}) {
  return (
    <For each={props.sections}>
      {(section) => (
        <PickerSection label={section.label}>
          <EmoteGrid
            items={section.emotes.map((e) => ({ value: e.name, url: e.url, label: e.name, accessible: e.accessible }))}
            onSelect={props.onSelect}
          />
        </PickerSection>
      )}
    </For>
  );
}
