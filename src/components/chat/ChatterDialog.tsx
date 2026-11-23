import { Search, X } from "lucide-solid";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import * as chatters from "../../lib/services/chatters.ts";
import { chatterListFor } from "../../lib/stores/chatters.ts";
import { formatViewers } from "../../lib/format/stream.ts";
import { groupChatters } from "../../lib/utils/chatterGroups.ts";
import { autofocus } from "../../lib/reactive/focus.ts";
import type { UserRef } from "../../lib/types/index.ts";
import ChatterPicture from "../ui/ChatterPicture.tsx";
import Field from "../ui/Field.tsx";
import IconButton from "../ui/IconButton.tsx";
import Loading from "../ui/Loading.tsx";
import Modal from "../ui/Modal.tsx";

const REFRESH_MS = 120_000;
const LOAD_MORE_PX = 400;

type Props = {
  broadcasterId: string;
  onClose: () => void;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function ChatterDialog(props: Props) {
  const [query, setQuery] = createSignal("");
  const list = () => chatterListFor(props.broadcasterId);
  const groups = createMemo(() =>
    groupChatters(
      list().chatters,
      {
        broadcasterId: props.broadcasterId,
        moderators: new Set(list().moderators),
        vips: new Set(list().vips),
      },
      query(),
    ),
  );

  onMount(() => {
    chatters.load(props.broadcasterId);
    const timer = setInterval(
      () => chatters.load(props.broadcasterId),
      REFRESH_MS,
    );
    onCleanup(() => clearInterval(timer));
  });

  function nearEnd(e: Event & { currentTarget: HTMLDivElement }) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_PX) {
      chatters.loadMore(props.broadcasterId);
    }
  }

  return (
    <Modal look="dialog" label={t("CHATTERS_TITLE")} onClose={props.onClose}>
      <div class="flex items-center gap-2">
        <h2 class="text-title text-ink">{t("CHATTERS_TITLE")}</h2>
        <span class="flex-1 text-body text-ink-faint tabular-nums">
          {formatViewers(list().total)}
        </span>
        <IconButton
          label={t("CHATTERS_CLOSE_LABEL")}
          size="sm"
          onClick={() => props.onClose()}
        >
          <X class="size-4" />
        </IconButton>
      </div>
      <Field
        ref={autofocus}
        icon={<Search class="size-4" />}
        placeholder={t("CHATTERS_SEARCH_PLACEHOLDER")}
        aria-label={t("CHATTERS_SEARCH_PLACEHOLDER")}
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
      />
      <div class="h-100 overflow-y-auto -mx-2 px-2" onScroll={nearEnd}>
        <Show
          when={groups().length}
          fallback={
            <Show
              when={query() || list().total}
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
                    <button
                      type="button"
                      class="w-full h-9 flex items-center gap-2.5 px-2 rounded-sm text-body text-ink text-left cursor-pointer hover:bg-raised"
                      onClick={(e) =>
                        props.onShowUserCard(e.clientX, e.clientY, user)
                      }
                      onContextMenu={(e) => {
                        e.preventDefault();
                        props.onUserContextMenu(e.clientX, e.clientY, user);
                      }}
                    >
                      <span class="size-6 shrink-0 grid place-items-center rounded-full overflow-hidden bg-raised text-micro">
                        <ChatterPicture
                          userId={user.id}
                          name={user.displayName}
                        />
                      </span>
                      <span class="truncate">{user.displayName}</span>
                    </button>
                  )}
                </For>
              </section>
            )}
          </For>
        </Show>
      </div>
    </Modal>
  );
}
