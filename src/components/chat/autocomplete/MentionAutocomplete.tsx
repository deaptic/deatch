import { onCleanup, Show } from "solid-js";
import Suggestions from "../../suggestions/Suggestions.tsx";
import { chattersByChannel } from "../../../lib/stores/users.ts";
import { feedUserNickname } from "../../../lib/stores/preferences.ts";
import type { ChatAutocompleteController } from "./controller.ts";

type MentionSuggestion = { login: string; displayName: string; color: string; nickname?: string };

type Props = {
  controller: ChatAutocompleteController;
  broadcasterId: string;
};

export default function MentionAutocomplete(props: Props) {
  const suggestions = (): MentionSuggestion[] => {
    const q = props.controller.queryFor("mention");
    if (q === null) return [];
    const bucket = chattersByChannel.get(props.broadcasterId);
    if (!bucket) return [];
    const lower = q.toLowerCase();
    type Ranked = { login: string; displayName: string; color: string; nickname?: string; lastSeen: number };
    const starts: Ranked[] = [];
    const contains: Ranked[] = [];
    for (const c of bucket.values()) {
      const nickname = feedUserNickname(c.login);
      const l = c.login.toLowerCase();
      const d = c.displayName.toLowerCase();
      const n = nickname?.toLowerCase();
      const ranked: Ranked = { login: c.login, displayName: c.displayName, color: c.color, nickname, lastSeen: c.lastSeen };
      if (lower === "" || l.startsWith(lower) || d.startsWith(lower) || n?.startsWith(lower)) {
        starts.push(ranked);
      } else if (l.includes(lower) || d.includes(lower) || (n && n.includes(lower))) {
        contains.push(ranked);
      }
    }
    starts.sort((a, b) => b.lastSeen - a.lastSeen);
    contains.sort((a, b) => b.lastSeen - a.lastSeen);
    return [...starts, ...contains]
      .slice(0, 10)
      .map(({ lastSeen: _, ...rest }) => rest);
  };

  function select(s: MentionSuggestion) {
    props.controller.clearAndSplice(
      /(?:^|\s)@(\w*)$/,
      (m) => (m.startsWith("@") ? "" : m[0]) + "@" + s.login + " ",
    );
  }

  const render = (s: MentionSuggestion) => (
    <>
      <span class="font-semibold text-left truncate" style={{ color: s.color || "var(--color-text)" }}>
        {s.nickname ?? s.displayName}
      </span>
      <Show when={s.nickname}>
        <span class="text-text-muted text-sm truncate">({s.displayName})</span>
      </Show>
      <span class="flex-1" />
      <span class="text-xs font-semibold shrink-0 text-text-muted">
        {s.displayName.toLowerCase() !== s.login ? s.login : ""}
      </span>
    </>
  );

  return (
    <Show when={suggestions().length > 0}>
      <Suggestions<MentionSuggestion>
        suggestions={suggestions}
        onSelect={select}
        onDismiss={props.controller.dismiss}
        renderItem={render}
        ref={(api) => {
          props.controller.registerKeyHandler("mention", api.handleKey);
          onCleanup(() => props.controller.unregisterKeyHandler("mention"));
        }}
      />
    </Show>
  );
}
