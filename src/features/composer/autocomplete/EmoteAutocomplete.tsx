import { createMemo, onCleanup, Show } from "solid-js";
import Suggestions from "../../../kit/Suggestions.tsx";
import { TRIGGERS } from "./detect.ts";
import {
  type EmoteProvider,
  emoteZoom,
  typeableEmotes,
} from "../../emotes/index.ts";
import { rankSuggestions } from "../../../lib/utils/rankSuggestions.ts";
import type { ChatAutocompleteController } from "./controller.ts";

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
    return rankSuggestions(items, q, {
      keys: (s) => [s.name.toLowerCase()],
      compare: (a, b) => a.name.localeCompare(b.name),
      limit: 10,
    });
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
      <span class="text-ink flex-1 text-left truncate">{s.name}</span>
      <span class="text-small font-semibold shrink-0 text-ink-soft">
        {s.source}
      </span>
    </>
  );

  return (
    <Show when={suggestions().length > 0}>
      <Suggestions<EmoteSuggestion>
        suggestions={suggestions}
        onSelect={select}
        onDismiss={props.controller.dismiss}
        renderItem={render}
        ref={(api) => {
          props.controller.register("emote", api);
          onCleanup(() => props.controller.unregister("emote"));
        }}
      />
    </Show>
  );
}
