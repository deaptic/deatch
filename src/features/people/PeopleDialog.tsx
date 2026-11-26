import { Search, X } from "lucide-solid";
import {
  createSignal,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { type MessageKey, t } from "../../shared/i18n/index.ts";
import * as chatters from "./store.ts";
import { hasPermission, type Capability } from "../permissions/index.ts";
import { formatCount } from "../../shared/format/stream.ts";
import { autofocus } from "../../shared/solid/focus.ts";
import type { UserRef } from "../../shared/types/index.ts";
import Field from "../../kit/Field.tsx";
import IconButton from "../../kit/IconButton.tsx";
import Modal from "../../kit/Modal.tsx";
import Segmented from "../../kit/Segmented.tsx";
import BannedTab from "./BannedTab.tsx";
import ChattersTab from "./ChattersTab.tsx";
import FollowersTab from "./FollowersTab.tsx";
import RolesTab from "./RolesTab.tsx";
import PanelHeader from "../../kit/PanelHeader.tsx";

const REFRESH_MS = 120_000;

type Tab = "chatters" | "followers" | "roles" | "banned";

const TABS: { tab: Tab; label: MessageKey; capability: Capability }[] = [
  {
    tab: "chatters",
    label: "PEOPLE_CHATTERS_TAB_LABEL",
    capability: "moderate",
  },
  {
    tab: "followers",
    label: "PEOPLE_FOLLOWERS_TAB_LABEL",
    capability: "moderate",
  },
  { tab: "roles", label: "PEOPLE_ROLES_TAB_LABEL", capability: "manageRoles" },
  { tab: "banned", label: "PEOPLE_BANNED_TAB_LABEL", capability: "viewBans" },
];

type Props = {
  broadcasterId: string;
  onClose: () => void;
  onShowUserCard: (x: number, y: number, user: UserRef) => void;
  onUserContextMenu: (x: number, y: number, user: UserRef) => void;
};

export default function PeopleDialog(props: Props) {
  const [picked, setPicked] = createSignal<Tab>("chatters");
  const [query, setQuery] = createSignal("");
  const tabs = () =>
    TABS.filter((t) => hasPermission(props.broadcasterId, t.capability));
  const tab = (): Tab =>
    tabs().some((t) => t.tab === picked()) ? picked() : "chatters";
  const [paged, setPaged] = createSignal<{
    count: number;
    more: boolean;
  } | null>(null);
  const count = () => {
    const list = chatters.listFor(props.broadcasterId);
    if (tab() === "chatters") return formatCount(list.total);
    if (tab() === "roles") {
      return t("PEOPLE_COUNT_VALUE", {
        count: list.moderators.length + list.vips.length,
        more: "false",
      });
    }
    const b = paged();
    return b
      ? t("PEOPLE_COUNT_VALUE", { count: b.count, more: String(b.more) })
      : "";
  };

  onMount(() => {
    const refresh = () => chatters.load(props.broadcasterId);
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    onCleanup(() => clearInterval(timer));
  });

  return (
    <Modal variant="dialog" label={t("PEOPLE_TITLE")} onClose={props.onClose}>
      <PanelHeader
        title={t("PEOPLE_TITLE")}
        count={count()}
        actions={
          <IconButton
            label={t("CHATTERS_CLOSE_LABEL")}
            tip={false}
            size="sm"
            onClick={() => props.onClose()}
          >
            <X class="size-4" />
          </IconButton>
        }
      />
      <Show when={tabs().length > 1}>
        <Segmented
          label={t("PEOPLE_TITLE")}
          fill
          value={tab()}
          options={tabs().map((x) => ({ value: x.tab, label: t(x.label) }))}
          onChange={(next) => {
            setPaged(null);
            setPicked(next);
          }}
        />
      </Show>
      <div class="h-112 min-h-0 flex flex-col gap-4">
        <Show when={tab() !== "roles"}>
          <Field
            ref={autofocus}
            icon={<Search class="size-4" />}
            placeholder={t("PEOPLE_SEARCH_PLACEHOLDER")}
            aria-label={t("PEOPLE_SEARCH_PLACEHOLDER")}
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
        </Show>
        <Switch>
          <Match when={tab() === "chatters"}>
            <ChattersTab
              broadcasterId={props.broadcasterId}
              query={query()}
              onShowUserCard={props.onShowUserCard}
              onUserContextMenu={props.onUserContextMenu}
            />
          </Match>
          <Match when={tab() === "followers"}>
            <FollowersTab
              onCount={(count, more) => setPaged({ count, more })}
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
              onCount={(count, more) => setPaged({ count, more })}
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
