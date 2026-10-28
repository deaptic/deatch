import { AtSign } from "lucide-solid";
import { createEffect, Show } from "solid-js";
import InboxGroup from "./InboxGroup.tsx";
import { mentions } from "../../lib/stores/inbox.ts";
import * as inbox from "../../lib/services/inbox.ts";
import type { Mention } from "../../lib/types/index.ts";
import * as users from "../../lib/services/users.ts";
import Button from "../ui/Button.tsx";
import EmptyState from "../ui/EmptyState.tsx";
import Popover from "../ui/Popover.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  onJump: (
    broadcasterId: string,
    messageId: string,
    timestamp: number | null,
  ) => void;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function Inbox(props: Props) {
  createEffect(() => {
    const ids = [
      ...new Set(
        mentions().flatMap((m) => [m.message.chatter_user_id, m.broadcasterId]),
      ),
    ];
    if (ids.length) users.get(ids).catch(() => {});
  });

  const unread = () => mentions().filter((m) => m.unread);
  const seen = () => mentions().filter((m) => !m.unread);

  function jump(m: Mention) {
    props.onJump(m.broadcasterId, m.message.message_id, m.message.timestamp);
    props.onClose();
  }

  function openChannel(m: Mention) {
    props.onOpenChannel(m.broadcasterId);
    props.onClose();
  }

  const clear = (m: Mention) => inbox.dismiss(m.id);

  return (
    <Popover x={props.x} y={props.y} align="center" onClose={props.onClose}>
      <div class="w-120 max-w-full max-h-160 flex flex-col">
        <header class="h-header shrink-0 flex items-center gap-2 pl-5 pr-3 border-b border-line-soft">
          <h2 class="text-title text-ink flex-1">{t("INBOX_TITLE")}</h2>
          <Show when={mentions().length > 0}>
            <Button variant="ghost" size="sm" onClick={inbox.dismissAll}>
              {t("INBOX_CLEAR_ALL")}
            </Button>
          </Show>
        </header>
        <Show
          when={mentions().length > 0}
          fallback={
            <EmptyState
              icon={<AtSign />}
              title={t("INBOX_EMPTY_TITLE")}
              body={t("INBOX_EMPTY_BODY")}
            />
          }
        >
          <div class="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-4">
            <InboxGroup
              label={t("INBOX_NEW")}
              mentions={unread()}
              onJump={jump}
              onOpenChannel={openChannel}
              onClear={clear}
            />
            <InboxGroup
              label={t("INBOX_EARLIER")}
              mentions={seen()}
              onJump={jump}
              onOpenChannel={openChannel}
              onClear={clear}
            />
          </div>
        </Show>
      </div>
    </Popover>
  );
}
