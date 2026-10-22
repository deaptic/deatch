import { createSignal, For, Match, Switch } from "solid-js";
import type { GiftRecipient } from "../../../lib/types/index.ts";
import { formatLocale, t } from "../../../lib/i18n/index.ts";
import { knownChatterColor } from "../../../lib/stores/users.ts";
import DisplayName from "../../ui/DisplayName.tsx";
import type { UserActions } from "../../ui/userLink.ts";

/// A big gift stays a line until someone asks for the rest.
const SHOWN = 8;

type Props = UserActions & { recipients: GiftRecipient[] };

export default function GiftRecipients(props: Props) {
  const [expanded, setExpanded] = createSignal(false);
  const hidden = () =>
    expanded() ? 0 : Math.max(0, props.recipients.length - SHOWN);
  const shown = () =>
    props.recipients.slice(0, props.recipients.length - hidden());

  // The locale's own list ("a, b and 3 more"), with names and the button
  // slotted into its element parts.
  const parts = () => {
    const items = shown().map((r) => r.name);
    if (hidden()) items.push(t("EVENT_GIFT_MORE", { count: hidden() }));
    let element = 0;
    return new Intl.ListFormat(formatLocale())
      .formatToParts(items)
      .map((part) =>
        part.type === "element"
          ? { kind: "element" as const, index: element++, text: part.value }
          : { kind: "literal" as const, text: part.value }
      );
  };

  return (
    <span class="block text-ink-soft">
      {`${t("EVENT_GIFTED_TO")} `}
      <For each={parts()}>
        {(part) => (
          <Switch fallback={part.text}>
            <Match when={part.kind === "element" && shown()[part.index]}>
              {(recipient) => (
                <DisplayName
                  login={recipient().login}
                  displayName={recipient().name}
                  color={recipient().id
                    ? knownChatterColor(recipient().id!)
                    : undefined}
                  userId={recipient().id}
                  onShowUserCard={props.onShowUserCard}
                  onUserContextMenu={props.onUserContextMenu}
                />
              )}
            </Match>
            <Match when={part.kind === "element"}>
              <button
                type="button"
                class="text-ink-soft hover:text-ink transition-colors duration-snap"
                onClick={() => setExpanded(true)}
              >
                {part.text}
              </button>
            </Match>
          </Switch>
        )}
      </For>
    </span>
  );
}
