import { For, type JSX, Show } from "solid-js";
import { type MessageKey, t } from "../../shared/i18n/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import Kbd from "../../kit/Kbd.tsx";
import Text from "../../kit/Text.tsx";
import Divider from "../../kit/Divider.tsx";
import Surface from "../../kit/Surface.tsx";

type Hint = { action: string; label: MessageKey };

const EVERYONE: Hint[] = [
  { action: "feed::reply", label: "CHAT_HINT_REPLY_LABEL" },
  { action: "feed::copy", label: "CHAT_HINT_COPY_LABEL" },
  { action: "feed::userCard", label: "CHAT_HINT_USER_CARD_LABEL" },
];

const ARM: Hint[] = [{ action: "mod::arm", label: "CHAT_HINT_MODERATE_LABEL" }];

const MODERATE: Hint[] = [
  { action: "mod::delete", label: "CHAT_HINT_DELETE_LABEL" },
  { action: "mod::purge", label: "CHAT_HINT_PURGE_LABEL" },
  { action: "mod::timeout", label: "CHAT_HINT_TIMEOUT_LABEL" },
  { action: "mod::ban", label: "CHAT_HINT_BAN_LABEL" },
  { action: "panel::close", label: "CHAT_HINT_CANCEL_LABEL" },
];

function Hints(props: { hints: Hint[] }): JSX.Element {
  const bound = () =>
    props.hints.flatMap((hint) => {
      const combo = shortcuts.keyFor(hint.action);
      return combo ? [{ combo, label: hint.label }] : [];
    });
  return (
    <For each={bound()}>
      {(hint) => (
        <span class="shrink-0 flex items-center gap-1.5">
          <Kbd size="sm" combo={hint.combo} />
          <Text size="sm" tone="soft" nowrap>
            {t(hint.label)}
          </Text>
        </span>
      )}
    </For>
  );
}

export default function SelectionHints(props: {
  moderator: boolean;
  moderating: string | null;
}) {
  return (
    <Surface tone="none" edge="bottom">
      <div class="flex items-center gap-3 px-4 py-1.5 overflow-hidden">
        <Show
          when={props.moderating}
          fallback={
            <>
              <Hints hints={EVERYONE} />
              <Show when={props.moderator}>
                <Divider vertical />
                <Hints hints={ARM} />
              </Show>
            </>
          }
        >
          {(name) => (
            <>
              <Text size="sm" bold tone="accent" nowrap class="shrink-0">
                {t("CHAT_HINT_MODERATING_LABEL", { name: name() })}
              </Text>
              <Hints hints={MODERATE} />
            </>
          )}
        </Show>
      </div>
    </Surface>
  );
}
