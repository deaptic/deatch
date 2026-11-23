import { createMemo, For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import * as chatters from "./store.ts";
import { groupChatters } from "./model.ts";
import type { UserRef } from "../../lib/types/index.ts";
import Loading from "../../kit/Loading.tsx";
import PersonRow from "./ui/PersonRow.tsx";

const LOAD_MORE_PX = 400;

type Props = {
  broadcasterId: string;
  query: string;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

const idsOf = (users: UserRef[]) => new Set(users.map((u) => u.id));

export default function ChattersTab(props: Props) {
  const list = () => chatters.listFor(props.broadcasterId);
  const groups = createMemo(() =>
    groupChatters(
      list().chatters,
      {
        broadcasterId: props.broadcasterId,
        moderators: idsOf(list().moderators),
        vips: idsOf(list().vips),
      },
      props.query,
    ),
  );

  function nearEnd(e: Event & { currentTarget: HTMLDivElement }) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_PX) {
      chatters.loadMore(props.broadcasterId);
    }
  }

  return (
    <div class="flex-1 min-h-0 overflow-y-auto -mx-2 px-2" onScroll={nearEnd}>
      <Show
        when={groups().length}
        fallback={
          <Show
            when={props.query || list().total}
            fallback={
              <div class="grid place-items-center py-6">
                <Loading />
              </div>
            }
          >
            <p class="py-3 text-body text-ink-faint">{t("CHATTERS_EMPTY")}</p>
          </Show>
        }
      >
        <For each={groups()}>
          {(group) => (
            <section>
              <h3 class="px-2 pt-3 pb-1 text-small text-ink-faint">
                {t("CHATTERS_GROUP_TITLE", {
                  kind: group.kind,
                  count: group.users.length,
                })}
              </h3>
              <For each={group.users}>
                {(user) => (
                  <PersonRow
                    user={user}
                    onShowUserCard={props.onShowUserCard}
                    onUserContextMenu={props.onUserContextMenu}
                  />
                )}
              </For>
            </section>
          )}
        </For>
      </Show>
    </div>
  );
}
