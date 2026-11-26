import { onCleanup, onMount, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import Button from "../../kit/Button.tsx";
import Segmented from "../../kit/Segmented.tsx";
import SectionTitle from "../../kit/SectionTitle.tsx";
import Surface from "../../kit/Surface.tsx";
import Mentions from "./mentions/Mentions.tsx";
import * as mentions from "./mentions/store.ts";
import Whispers from "./whispers/Whispers.tsx";
import * as whispers from "./whispers/store.ts";
import { setTab, tab } from "./store.ts";

type Props = {
  onJump: (broadcasterId: string, messageId: string) => void;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function Inbox(props: Props) {
  onMount(() => {
    onCleanup(
      shortcuts.registerLocal("escape", () => {
        if (tab() !== "whispers" || !whispers.openPeer()) {
          return shortcuts.PASS;
        }
        whispers.back();
      }),
    );
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
