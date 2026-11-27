import { createMemo, onCleanup, Show } from "solid-js";
import Suggestions from "../../../kit/Suggestions.tsx";
import { TRIGGERS } from "./detect.ts";
import {
  type EmoteProvider,
  emoteUses,
  emoteZoom,
  rankEmotes,
  typeableEmotes,
} from "../../emotes/index.ts";
import type { ChatAutocompleteController } from "./controller.ts";
import Text from "../../../kit/Text.tsx";

type EmoteSuggestion = { name: string; url: string; source: EmoteProvider };

type Props = {
  controller: ChatAutocompleteController;
};

export default function EmoteAutocomplete(props: Props) {
  const allEmotes = createMemo(typeableEmotes);

  const suggestions = (): EmoteSuggestion[] => {
    const q = props.controller.queryFor("emote");
    if (!q) return [];
    const items: EmoteSuggestion[] = Object.entries(allEmotes()).map(
      ([name, entry]) => ({ name, url: entry.url, source: entry.source }),
    );
    return rankEmotes(items, q, emoteUses(), Date.now(), 10);
  };

  function select(s: EmoteSuggestion) {
    props.controller.clearAndSplice(
      TRIGGERS.emote,
      (m) => (m.startsWith(":") ? "" : m[0]) + s.name + " ",
    );
  }

  const render = (s: EmoteSuggestion) => (
    <>
      <img
        src={s.url}
        {...emoteZoom(s.url)}
        alt={s.name}
        class="size-6 object-contain shrink-0"
      />
      <Text tone="primary" align="left" truncate class="flex-1">
        {s.name}
      </Text>
      <Text size="sm" bold tone="soft" class="shrink-0">
        {s.source}
      </Text>
    </>
  );

  return (
    <Show when={suggestions().length > 0}>
      <Suggestions<EmoteSuggestion>
        suggestions={suggestions}
        onSelect={select}
        onClose={props.controller.dismiss}
        renderItem={render}
        ref={(api) => {
          props.controller.register("emote", api);
          onCleanup(() => props.controller.unregister("emote"));
        }}
      />
    </Show>
  );
}
