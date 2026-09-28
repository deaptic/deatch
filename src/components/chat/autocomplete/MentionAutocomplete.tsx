import { onCleanup, Show } from "solid-js";
import Suggestions from "../../suggestions/Suggestions.tsx";
import { chattersByChannel } from "../../../lib/stores/users.ts";
import { feedUserNickname } from "../../../lib/stores/preferences.ts";
import { rankSuggestions } from "../../../lib/utils/rankSuggestions.ts";
import type { ChatAutocompleteController } from "./controller.ts";

type MentionSuggestion = {
  login: string;
  displayName: string;
  color: string;
  nickname?: string;
};

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
    type Ranked = MentionSuggestion & { lastSeen: number };
    const items: Ranked[] = [...bucket.values()].map((c) => ({
      login: c.login,
      displayName: c.displayName,
      color: c.color,
      nickname: feedUserNickname(c.login),
      lastSeen: c.lastSeen,
    }));
    return rankSuggestions(items, q, {
      keys: (s) =>
        [s.login, s.displayName, s.nickname]
          .filter((v): v is string => !!v)
          .map((v) => v.toLowerCase()),
      compare: (a, b) => b.lastSeen - a.lastSeen,
      limit: 10,
    }).map(({ lastSeen: _, ...rest }) => rest);
  };

  function select(s: MentionSuggestion) {
    props.controller.clearAndSplice(
      /(?:^|\s)@(\w*)$/,
      (m) => (m.startsWith("@") ? "" : m[0]) + "@" + s.login + " ",
    );
  }

  const render = (s: MentionSuggestion) => (
    <>
      <span
        class="font-semibold text-left truncate text-(--name)"
        style={{ "--name": s.color || "var(--color-ink)" }}
      >
        {s.nickname ?? s.displayName}
      </span>
      <Show when={s.nickname}>
        <span class="text-ink-soft text-small truncate">({s.displayName})</span>
      </Show>
      <span class="flex-1" />
      <span class="text-small font-semibold shrink-0 text-ink-soft">
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
