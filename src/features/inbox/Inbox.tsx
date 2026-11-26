import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import { usingKeyboard } from "../../shared/keyboard/modality.ts";
import {
  createListNavigation,
  wrapIndex,
} from "../../shared/solid/createListNavigation.ts";
import Button from "../../kit/Button.tsx";
import Segmented from "../../kit/Segmented.tsx";
import SectionTitle from "../../kit/SectionTitle.tsx";
import Surface from "../../kit/Surface.tsx";
import Mentions from "./mentions/Mentions.tsx";
import * as mentions from "./mentions/store.ts";
import type { Mention } from "./mentions/types.ts";
import Whispers from "./whispers/Whispers.tsx";
import * as whispers from "./whispers/store.ts";
import { earlierMentions, newMentions, setTab, tab } from "./store.ts";

type Props = {
  onJump: (broadcasterId: string, messageId: string) => void;
  onOpenChannel: (broadcasterId: string) => void;
};

const { unlessFocusHandlesKeys } = shortcuts;

function switchTab() {
  setTab(tab() === "mentions" ? "whispers" : "mentions");
}

function stepWhisper(delta: 1 | -1) {
  const list = whispers.conversations();
  const at = list.findIndex((c) => c.peer.id === whispers.openPeer()?.id);
  const next = list[at === -1 ? 0 : wrapIndex(at, delta, list.length)];
  if (next) whispers.open(next.peer);
}

export default function Inbox(props: Props) {
  const ordered = () => [...newMentions(), ...earlierMentions()];
  const [navigating, setNavigating] = createSignal(false);
  const nav = createListNavigation({
    count: () => ordered().length,
    rowAt: (i) => {
      const id = ordered()[i]?.id;
      return id
        ? document.querySelector(`[data-mention-id="${CSS.escape(id)}"]`)
        : null;
    },
  });
  const highlighted = (): Mention | undefined =>
    navigating() && usingKeyboard() ? ordered()[nav.active()] : undefined;

  function jump(m: Mention) {
    mentions.markRead(m.id);
    props.onJump(m.broadcasterId, m.message.message_id);
  }

  const onMentions = (action: (m: Mention) => void) =>
    unlessFocusHandlesKeys(() => {
      const m = tab() === "mentions" ? highlighted() : undefined;
      if (!m) return shortcuts.PASS;
      action(m);
    });

  const step = (delta: 1 | -1) =>
    unlessFocusHandlesKeys(() => {
      if (tab() === "whispers") return stepWhisper(delta);
      if (highlighted()) nav.move(delta);
      else setNavigating(true);
    });

  onMount(() => {
    shortcuts.setContext("inboxOpen", true);
    const actions: [string, () => void | typeof shortcuts.PASS][] = [
      ["inboxPage::switchTab", unlessFocusHandlesKeys(switchTab)],
      ["inboxPage::selectPrev", step(-1)],
      ["inboxPage::selectNext", step(1)],
      ["inboxPage::open", onMentions(jump)],
      ["inboxPage::markRead", onMentions((m) => mentions.dismiss(m.id))],
    ];
    const stops = actions.map(([name, handler]) =>
      shortcuts.register(name, handler, "inboxOpen"),
    );
    stops.push(
      shortcuts.registerLocal("escape", () => {
        if (tab() !== "whispers" || !whispers.openPeer()) {
          return shortcuts.PASS;
        }
        whispers.back();
      }),
    );
    onCleanup(() => {
      for (const stop of stops) stop();
      shortcuts.setContext("inboxOpen", false);
    });
  });

  return (
    <div class="flex-1 min-h-0 flex flex-col">
      <Surface as="header" tone="none" edge="bottom" class="shrink-0">
        <div class="h-14 px-5 flex items-center gap-4">
          <SectionTitle>{t("INBOX_TITLE")}</SectionTitle>
          <Segmented
            label={t("INBOX_TITLE")}
            value={tab()}
            options={[
              {
                value: "mentions",
                label: t("INBOX_MENTIONS_TAB_LABEL"),
                count: mentions.unreadCount(),
              },
              {
                value: "whispers",
                label: t("INBOX_WHISPERS_TAB_LABEL"),
                count: whispers.unreadCount(),
              },
            ]}
            onChange={setTab}
          />
          <Show when={tab() === "mentions" && mentions.mentions().length}>
            <span class="ml-auto">
              <Button variant="ghost" size="sm" onClick={mentions.dismissAll}>
                {t("INBOX_CLEAR_ALL_LABEL")}
              </Button>
            </span>
          </Show>
        </div>
      </Surface>
      <Show when={tab() === "mentions"} fallback={<Whispers />}>
        <Mentions
          selectedId={highlighted()?.id ?? null}
          onJump={(m, messageId) => {
            mentions.markRead(m.id);
            props.onJump(m.broadcasterId, messageId);
          }}
          onOpenChannel={(m) => props.onOpenChannel(m.broadcasterId)}
        />
      </Show>
    </div>
  );
}
