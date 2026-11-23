import { Search, X } from "lucide-solid";
import {
  createSignal,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { t } from "../../../lib/i18n/index.ts";
import * as chatters from "../../../lib/services/chatters.ts";
import { chatterListFor } from "../../../lib/stores/chatters.ts";
import { user as currentUser } from "../../../lib/stores/users.ts";
import { formatViewers } from "../../../lib/format/stream.ts";
import { autofocus } from "../../../lib/reactive/focus.ts";
import type { UserRef } from "../../../lib/types/index.ts";
import Field from "../../ui/Field.tsx";
import IconButton from "../../ui/IconButton.tsx";
import Modal from "../../ui/Modal.tsx";
import Segmented from "../../ui/Segmented.tsx";
import BannedTab from "./BannedTab.tsx";
import ChattersTab from "./ChattersTab.tsx";
import RolesTab from "./RolesTab.tsx";

const REFRESH_MS = 120_000;

type Tab = "chatters" | "roles" | "banned";

type Props = {
  broadcasterId: string;
  onClose: () => void;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function PeopleDialog(props: Props) {
  const [tab, setTab] = createSignal<Tab>("chatters");
  const [query, setQuery] = createSignal("");
  const isOwner = () => props.broadcasterId === currentUser()?.id;
  const [banned, setBanned] = createSignal<{
    count: number;
    more: boolean;
  } | null>(null);
  const count = () => {
    const list = chatterListFor(props.broadcasterId);
    if (!isOwner() || tab() === "chatters") return formatViewers(list.total);
    if (tab() === "roles") {
      return t("PEOPLE_COUNT_VALUE", {
        count: list.moderators.length + list.vips.length,
        more: "false",
      });
    }
    const b = banned();
    return b
      ? t("PEOPLE_COUNT_VALUE", { count: b.count, more: String(b.more) })
      : "";
  };

  onMount(() => {
    const refresh = () => chatters.load(props.broadcasterId, isOwner());
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    onCleanup(() => clearInterval(timer));
  });

  return (
    <Modal look="dialog" label={t("PEOPLE_TITLE")} onClose={props.onClose}>
      <div class="flex items-center gap-2">
        <h2 class="text-title text-ink">{t("PEOPLE_TITLE")}</h2>
        <span class="flex-1 text-body text-ink-faint tabular-nums">
          {count()}
        </span>
        <IconButton
          label={t("CHATTERS_CLOSE_LABEL")}
          size="sm"
          onClick={() => props.onClose()}
        >
          <X class="size-4" />
        </IconButton>
      </div>
      <Show when={isOwner()}>
        <Segmented
          label={t("PEOPLE_TITLE")}
          fill
          value={tab()}
          options={[
            { value: "chatters", label: t("PEOPLE_CHATTERS_TAB_LABEL") },
            { value: "roles", label: t("PEOPLE_ROLES_TAB_LABEL") },
            { value: "banned", label: t("PEOPLE_BANNED_TAB_LABEL") },
          ]}
          onChange={setTab}
        />
      </Show>
      <div class="h-112 min-h-0 flex flex-col gap-4">
        <Show when={!isOwner() || tab() !== "roles"}>
          <Field
            ref={autofocus}
            icon={<Search class="size-4" />}
            placeholder={t("CHATTERS_SEARCH_PLACEHOLDER")}
            aria-label={t("CHATTERS_SEARCH_PLACEHOLDER")}
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
        </Show>
        <Switch>
          <Match when={tab() === "chatters" || !isOwner()}>
            <ChattersTab
              broadcasterId={props.broadcasterId}
              query={query()}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
          </Match>
          <Match when={tab() === "roles"}>
            <RolesTab
              broadcasterId={props.broadcasterId}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
          </Match>
          <Match when={tab() === "banned"}>
            <BannedTab
              onCount={(count, more) => setBanned({ count, more })}
              broadcasterId={props.broadcasterId}
              query={query()}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
          </Match>
        </Switch>
      </div>
    </Modal>
  );
}
