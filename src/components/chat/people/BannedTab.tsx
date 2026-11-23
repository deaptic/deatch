import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { t } from "../../../lib/i18n/index.ts";
import {
  getBannedUsers,
  unbanUser,
} from "../../../platform/twitch/moderation.ts";
import * as clock from "../../../lib/services/clock.ts";
import { formatElapsed } from "../../../lib/format/duration.ts";
import { matchesPerson } from "../../../lib/utils/chatterGroups.ts";
import type { BannedUser, UserRef } from "../../../lib/types/index.ts";
import Button from "../../ui/Button.tsx";
import Loading from "../../ui/Loading.tsx";
import PersonRow from "./PersonRow.tsx";

const LOAD_MORE_PX = 400;

type Props = {
  onCount: (count: number, more: boolean) => void;
  broadcasterId: string;
  query: string;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function BannedTab(props: Props) {
  const [banned, setBanned] = createSignal<BannedUser[] | null>(null);
  const [cursor, setCursor] = createSignal<string | null>(null);
  let loading = false;

  function load(after: string | null) {
    if (loading) return;
    loading = true;
    getBannedUsers({ broadcasterId: props.broadcasterId, cursor: after })
      .then((page) => {
        setBanned((list) => [...(after ? (list ?? []) : []), ...page.banned]);
        setCursor(page.cursor);
      })
      .catch(() => setBanned((list) => list ?? []))
      .finally(() => {
        loading = false;
      });
  }

  onMount(() => load(null));

  createEffect(() => {
    const list = banned();
    if (list) props.onCount(list.length, cursor() !== null);
  });

  function nearEnd(e: Event & { currentTarget: HTMLDivElement }) {
    const el = e.currentTarget;
    const next = cursor();
    if (next && el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_PX)
      load(next);
  }

  function unban(entry: BannedUser) {
    unbanUser({ broadcasterId: props.broadcasterId, userId: entry.user.id })
      .then(() =>
        setBanned((list) =>
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
    <div class="flex-1 min-h-0 overflow-y-auto -mx-2 px-2" onScroll={nearEnd}>
      <Show
        when={banned()}
        fallback={
          <div class="grid place-items-center py-6">
            <Loading />
          </div>
        }
      >
        <Show
          when={shown().length}
          fallback={
            <p class="py-3 text-body text-ink-faint">
              {t("PEOPLE_BANNED_EMPTY")}
            </p>
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
