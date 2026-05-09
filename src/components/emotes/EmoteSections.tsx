import { For } from "solid-js";
import type { EmoteSection } from "../../emotes";
import type { GridItem } from "./types";
import EmoteGrid from "./EmoteGrid";
import PickerSection from "./PickerSection";

type Props = {
  sections: EmoteSection[];
  onSelect: (name: string) => void;
  isFavorite: (value: string) => boolean;
  onToggleFavorite: (item: GridItem) => void;
};

export default function EmoteSections(props: Props) {
  return (
    <For each={props.sections}>
      {(section) => (
        <PickerSection label={section.label}>
          <EmoteGrid
            items={section.emotes.map((e) => ({ value: e.name, url: e.url, label: e.name, accessible: e.accessible }))}
            onSelect={props.onSelect}
            isFavorite={props.isFavorite}
            onToggleFavorite={props.onToggleFavorite}
          />
        </PickerSection>
      )}
    </For>
  );
}
