import { AtSign } from "lucide-solid";
import { createEffect, Show } from "solid-js";
import Group from "./Group.tsx";
import * as inbox from "./store.ts";
import type { Mention } from "../../lib/types/index.ts";
import * as users from "../../lib/services/users.ts";
import Button from "../../kit/Button.tsx";
import EmptyState from "../../kit/EmptyState.tsx";
import Popover from "../../kit/Popover.tsx";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  onJump: (broadcasterId: string, messageId: string) => void;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function Inbox(props: Props) {
  createEffect(() => {
    const ids = [
      ...new Set(
        inbox
          .mentions()
          .flatMap((m) => [m.message.chatter_user_id, m.broadcasterId]),
      ),
    ];
    if (ids.length) users.get(ids).catch(() => {});
  });

  const unread = () => inbox.mentions().filter((m) => m.unread);
  const seen = () => inbox.mentions().filter((m) => !m.unread);

  function jump(m: Mention) {
    props.onJump(m.broadcasterId, m.message.message_id);
    props.onClose();
  }

  function openChannel(m: Mention) {
    props.onOpenChannel(m.broadcasterId);
    props.onClose();
  }

  const clear = (m: Mention) => inbox.dismiss(m.id);

  return (
    <Popover x={props.x} y={props.y} align="center" onClose={props.onClose}>
      <div class="w-120 max-w-full max-h-160 min-h-0 flex flex-col">
        <header class="h-header shrink-0 flex items-center gap-2 pl-5 pr-3">
          <h2 class="text-title text-ink flex-1">{t("INBOX_TITLE")}</h2>
          <Show when={inbox.mentions().length > 0}>
            <Button variant="ghost" size="sm" onClick={inbox.dismissAll}>
              {t("INBOX_CLEAR_ALL_LABEL")}
            </Button>
          </Show>
        </header>
        <Show
          when={inbox.mentions().length > 0}
          fallback={
            <EmptyState
              icon={<AtSign />}
              title={t("INBOX_EMPTY")}
              body={t("INBOX_EMPTY_DESCRIPTION")}
            />
          }
        >
          <div class="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-4">
            <Group
              label={t("INBOX_NEW_TITLE")}
              mentions={unread()}
              onJump={jump}
              onOpenChannel={openChannel}
              onClear={clear}
            />
            <Group
              label={t("INBOX_EARLIER_TITLE")}
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
