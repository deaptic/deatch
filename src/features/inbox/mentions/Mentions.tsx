import { AtSign } from "lucide-solid";
import { createEffect, For, Show } from "solid-js";
import { t, type MessageKey } from "../../../shared/i18n/index.ts";
import EmptyState from "../../../kit/EmptyState.tsx";
import SectionLabel from "../../../kit/SectionLabel.tsx";
import { users } from "../../users/index.ts";
import MentionCard from "./MentionCard.tsx";
import * as mentions from "./store.ts";
import type { Mention } from "./types.ts";

type Actions = {
  onJump: (mention: Mention, messageId: string) => void;
  onOpenChannel: (mention: Mention) => void;
};

function Section(props: Actions & { label: MessageKey; list: Mention[] }) {
  return (
    <Show when={props.list.length}>
      <section class="flex flex-col gap-3">
        <div class="px-1">
          <SectionLabel>{t(props.label)}</SectionLabel>
        </div>
        <For each={props.list}>
          {(m) => (
            <MentionCard
              mention={m}
              onJump={(messageId) => props.onJump(m, messageId)}
              onOpenChannel={() => props.onOpenChannel(m)}
            />
          )}
        </For>
      </section>
    </Show>
  );
}

export default function Mentions(props: Actions) {
  createEffect(() => {
    const ids = [
      ...new Set(
        mentions
          .mentions()
          .flatMap((m) => [m.message.chatter_user_id, m.broadcasterId]),
      ),
    ];
    if (ids.length) users.get(ids).catch(() => {});
  });

  const unread = () => mentions.mentions().filter((m) => m.unread);
  const seen = () => mentions.mentions().filter((m) => !m.unread);

  return (
    <Show
      when={mentions.mentions().length}
      fallback={
        <EmptyState
          icon={<AtSign />}
          title={t("INBOX_EMPTY")}
          body={t("INBOX_EMPTY_DESCRIPTION")}
        />
      }
    >
      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="w-full max-w-180 mx-auto px-5 py-5 flex flex-col gap-8">
          <Section {...props} label="INBOX_NEW_TITLE" list={unread()} />
          <Section {...props} label="INBOX_EARLIER_TITLE" list={seen()} />
        </div>
      </div>
    </Show>
  );
}
