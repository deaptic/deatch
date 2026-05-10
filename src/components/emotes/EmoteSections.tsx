import { For } from "solid-js";
import type { EmoteSection } from "../../state/emotes";
import type { EmoteGridItem } from "./types";
import EmoteGrid from "./EmoteGrid";
import EmotePickerSection from "./EmotePickerSection";

type Props = {
  sections: EmoteSection[];
  onSelect: (name: string) => void;
  isFavorite: (value: string) => boolean;
  onToggleFavorite: (item: EmoteGridItem) => void;
};

export default function EmoteSections(props: Props) {
  return (
    <For each={props.sections}>
      {(section) => (
        <EmotePickerSection label={section.label}>
          <EmoteGrid
            items={section.emotes.map((e) => ({ value: e.name, url: e.url, label: e.name }))}
            onSelect={props.onSelect}
            isFavorite={props.isFavorite}
            onToggleFavorite={props.onToggleFavorite}
          />
        </EmotePickerSection>
      )}
    </For>
  );
}
