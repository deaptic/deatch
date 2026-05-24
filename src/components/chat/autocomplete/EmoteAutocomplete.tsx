import { createMemo, onCleanup, Show } from "solid-js";
import Suggestions from "../../suggestions/Suggestions";
import {
  globalEmotes,
  userEmotes,
  sevenTvGlobal,
  bttvGlobal,
  ffzGlobal,
  sevenTvChannel,
  bttvChannel,
  ffzChannel,
} from "../../../state/emotes";
import type { ChatAutocompleteController } from "./controller";

type Source = "Twitch" | "7TV" | "BetterTTV" | "FrankerFaceZ";
type EmoteEntry = { url: string; source: Source };
type EmoteSuggestion = { name: string; url: string; source: Source };

type Props = {
  controller: ChatAutocompleteController;
};

export default function EmoteAutocomplete(props: Props) {
  const allEmotes = createMemo<Record<string, EmoteEntry>>(() => {
    const map: Record<string, EmoteEntry> = {};
    const add = (name: string, url: string, source: Source) => {
      if (!map[name]) map[name] = { url, source };
    };
    for (const e of sevenTvChannel()) add(e.name, e.url, "7TV");
    for (const e of bttvChannel()) add(e.name, e.url, "BetterTTV");
    for (const e of ffzChannel()) add(e.name, e.url, "FrankerFaceZ");
    for (const e of sevenTvGlobal()) add(e.name, e.url, "7TV");
    for (const e of bttvGlobal()) add(e.name, e.url, "BetterTTV");
    for (const e of ffzGlobal()) add(e.name, e.url, "FrankerFaceZ");
    for (const e of userEmotes()) add(e.name, e.url, "Twitch");
    for (const e of globalEmotes()) add(e.name, e.url, "Twitch");
    return map;
  });

  const suggestions = (): EmoteSuggestion[] => {
    const q = props.controller.queryFor("emote");
    if (!q) return [];
    const lower = q.toLowerCase();
    const starts: EmoteSuggestion[] = [];
    const contains: EmoteSuggestion[] = [];
    for (const [name, entry] of Object.entries(allEmotes())) {
      const n = name.toLowerCase();
      if (n.startsWith(lower)) starts.push({ name, url: entry.url, source: entry.source });
      else if (n.includes(lower)) contains.push({ name, url: entry.url, source: entry.source });
    }
    starts.sort((a, b) => a.name.localeCompare(b.name));
    contains.sort((a, b) => a.name.localeCompare(b.name));
    return [...starts, ...contains].slice(0, 10);
  };

  function select(s: EmoteSuggestion) {
    props.controller.clearAndSplice(
      /(?:^|\s):(\w+)$/,
      (m) => (m.startsWith(":") ? "" : m[0]) + s.name + " ",
    );
  }

  const render = (s: EmoteSuggestion) => (
    <>
      <img src={s.url} alt={s.name} class="w-6 h-6 object-contain shrink-0" />
      <span class="text-text flex-1 text-left truncate">{s.name}</span>
      <span class="text-xs font-semibold shrink-0 text-text-muted">{s.source}</span>
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
          props.controller.registerKeyHandler("emote", api.handleKey);
          onCleanup(() => props.controller.unregisterKeyHandler("emote"));
        }}
      />
    </Show>
  );
}
