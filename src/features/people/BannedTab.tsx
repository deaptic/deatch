import { createEffect, For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { getBannedUsers, unbanUser } from "../../platform/twitch/moderation.ts";
import * as clock from "../../shared/clock.ts";
import { formatElapsed } from "../../shared/format/duration.ts";
import { matchesPerson } from "./model.ts";
import type { BannedUser, UserRef } from "../../shared/types/index.ts";
import Button from "../../kit/Button.tsx";
import Loading from "../../kit/Loading.tsx";
import PersonRow from "./PersonRow.tsx";
import { createPaged } from "./createPaged.ts";
import EmptyState from "../../kit/EmptyState.tsx";

type Props = {
  onCount: (count: number, more: boolean) => void;
  broadcasterId: string;
  query: string;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function BannedTab(props: Props) {
  const paged = createPaged(
    (cursor) =>
      getBannedUsers({ broadcasterId: props.broadcasterId, cursor }).then(
        (page) => ({ items: page.banned, cursor: page.cursor, total: null }),
      ),
    { loadAllWhile: () => props.query.trim() !== "" },
  );
  const banned = paged.items;

  createEffect(() => {
    const c = paged.count();
    if (c) props.onCount(c.count, c.more);
  });

  function unban(entry: BannedUser) {
    unbanUser({ broadcasterId: props.broadcasterId, userId: entry.user.id })
      .then(() =>
        paged.setItems((list) =>
          (list ?? []).filter((b) => b.user.id !== entry.user.id),
        ),
      )
      .catch(() => {});
  }

  const detail = (entry: BannedUser) =>
    t("PEOPLE_BAN_DETAIL_STATUS", {
      timeout: String(entry.expiresAt !== null),
      left: entry.expiresAt
        ? formatElapsed(clock.now(), Date.parse(entry.expiresAt))
        : "",
      moderator: entry.moderator.displayName,
      reason: entry.reason ?? "",
      hasReason: String(!!entry.reason),
    });

  const shown = () =>
    (banned() ?? []).filter((b) => matchesPerson(b.user, props.query));

  return (
    <div
      class="flex-1 min-h-0 overflow-y-auto -mx-2 px-2"
      onScroll={paged.nearEnd}
    >
      <Show when={banned()} fallback={<Loading block />}>
        <Show
          when={shown().length}
          fallback={
            <Show when={!paged.loading()} fallback={<Loading block />}>
              <EmptyState variant="list" body={t("PEOPLE_BANNED_EMPTY")} />
            </Show>
          }
        >
          <For each={shown()}>
            {(entry) => (
              <PersonRow
                user={entry.user}
                detail={detail(entry)}
                onShowUserCard={props.onShowUserCard}
                onUserContextMenu={props.onUserContextMenu}
                action={
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => unban(entry)}
                  >
                    {t("PEOPLE_UNBAN_LABEL")}
                  </Button>
                }
              />
            )}
          </For>
        </Show>
      </Show>
    </div>
  );
}
