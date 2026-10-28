import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
} from "solid-js";
import { ChevronRight, Eye, Plus, Search, Settings } from "lucide-solid";
import * as browser from "../../lib/services/browser.ts";
import {
  appearanceRailExpanded,
  linkAudioLink,
  pinChannel,
  pinnedChannels,
  reorderPinnedChannels,
  setAppearanceRailExpanded,
} from "../../lib/stores/preferences.ts";
import { hasUnread } from "../../lib/stores/feeds.ts";
import { channelMentionCount } from "../../lib/stores/inbox.ts";
import {
  linkConnected,
  linkedChannel,
  linkMutedByLogin,
  linkWarmedChannels,
} from "../../lib/stores/link.ts";
import LinkMenu from "./LinkMenu.tsx";
import { linkClose } from "../../lib/api/link.ts";
import * as link from "../../lib/services/link.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import {
  activeView,
  isSettingsOpen,
  linkSynced,
  pendingChannel,
  selectedChannel,
  showExplore,
  toggleSettings,
} from "../../lib/stores/view.ts";
import * as users from "../../lib/services/users.ts";
import { user } from "../../lib/stores/users.ts";
import { createScrollAffordance } from "../../lib/primitives/createScrollAffordance.ts";
import { createRailChannels } from "./createRailChannels.ts";
import RailRow, { type SubTone } from "./RailRow.tsx";
import RailTile, { type TileTone } from "./RailTile.tsx";
import RailDivider from "./RailDivider.tsx";
import ChannelRow from "./ChannelRow.tsx";
import Avatar from "../ui/Avatar.tsx";
import ScrollChevron from "./ScrollChevron.tsx";
import RailRowSkeleton from "./RailRowSkeleton.tsx";
import { railGap } from "../ui/rowHeight.ts";
import TabMuteBadge from "./TabMuteBadge.tsx";
import InputPopover from "../ui/InputPopover.tsx";
import { SIDE_GAP } from "../ui/Popover.tsx";
import ChannelContextMenu from "../context-menus/ChannelContextMenu.tsx";
import * as session from "../../lib/services/session.ts";
import type { User } from "../../lib/types/index.ts";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  onSelect: (ch: User) => void;
  onToggleLink: () => void;
  onLiveChange?: (live: User[]) => void;
};

type LinkStatus = {
  sub: string;
  tone: SubTone;
  tile: TileTone | false;
  onClick?: () => void;
};

export default function Rail(props: Props) {
  const expanded = appearanceRailExpanded;
  const channels = createRailChannels(props.onLiveChange);
  const main = createScrollAffordance();
  const linkScroll = createScrollAffordance();

  const selectedId = () => {
    const v = activeView();
    return typeof v === "object" ? v.id : null;
  };

  const linkedOthers = () =>
    linkWarmedChannels().filter((c) => c?.id !== user()?.id);
  const ownTab = () => linkWarmedChannels().find((c) => c?.id === user()?.id);

  const warmedIds = createMemo(
    () => new Set(linkWarmedChannels().map((c) => c?.id)),
  );

  const isListed = (id: string) =>
    new Set(pinnedChannels()).has(id) ||
    warmedIds().has(id) ||
    linkedChannel()?.id === id ||
    channels.isLive(id) ||
    id === user()?.id;

  const nowViewing = createMemo(() => {
    const sel = selectedChannel();
    return sel && !isListed(sel.id) ? sel : null;
  });

  // The sub line says what Link can do right now; the tile only lights up
  // once a mode is engaged.
  const linkStatus = (): LinkStatus => {
    if (!linkConnected()) {
      return {
        sub: t("RAIL_LINK_ADD_FIREFOX"),
        tone: "soft",
        tile: false,
        onClick: openLinkMenu,
      };
    }
    if (linkWarmedChannels().length === 0) {
      return { sub: t("RAIL_LINK_NO_TABS"), tone: "soft", tile: false };
    }
    if (linkSynced()) {
      return {
        sub: t(linkAudioLink() ? "RAIL_LINK_SYNCED_AUDIO" : "RAIL_LINK_SYNCED"),
        tone: "positive",
        tile: "positive",
        onClick: props.onToggleLink,
      };
    }
    return {
      sub: t("RAIL_LINK_SYNC_BROWSER"),
      tone: "soft",
      tile: false,
      onClick: props.onToggleLink,
    };
  };

  const [chMenu, setChMenu] = createSignal<{
    ch: User;
    x: number;
    y: number;
  } | null>(null);
  const [addPop, setAddPop] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  const [addInput, setAddInput] = createSignal("");
  const [addLoading, setAddLoading] = createSignal(false);
  const [dragIdx, setDragIdx] = createSignal<number | null>(null);
  const [overIdx, setOverIdx] = createSignal<number | null>(null);
  let addBtn: HTMLButtonElement | undefined;
  const [linkMenu, setLinkMenu] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  let linkBtn: HTMLButtonElement | undefined;

  function openLinkMenu() {
    if (!linkBtn || linkMenu()) return setLinkMenu(null);
    const rect = linkBtn.getBoundingClientRect();
    setLinkMenu({ x: rect.right + SIDE_GAP, y: rect.top });
  }

  createEffect(() => {
    pinnedChannels();
    channels.onlineList().length;
    expanded();
    queueMicrotask(main.update);
  });

  createEffect(() => {
    linkWarmedChannels().length;
    queueMicrotask(linkScroll.update);
  });

  createEffect(() => {
    const sel = pendingChannel();
    if (!sel) return;
    queueMicrotask(() => {
      const targets = document.querySelectorAll(
        `[data-channel-id="${sel.id}"]`,
      );
      for (const target of targets) {
        (target as HTMLElement).scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    });
  });

  function openInBrowser(ch: User) {
    browser.openChannel(ch.login);
  }

  function startDrag(e: MouseEvent, idx: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragIdx(idx);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const row = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest("[data-pinned-index]") as HTMLElement | null;
      const i = row ? parseInt(row.dataset.pinnedIndex!) : null;
      setOverIdx(i !== null && !isNaN(i) ? i : null);
    };
    const end = () => {
      endDrag = undefined;
      setDragIdx(null);
      setOverIdx(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    const onUp = () => {
      const over = overIdx();
      if (over !== null && over !== idx) reorderPinnedChannels(idx, over);
      end();
    };
    endDrag = end;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }
  // Unmounting mid-drag must not leave the cursor or listeners behind.
  let endDrag: (() => void) | undefined;
  onCleanup(() => endDrag?.());

  function openAdd() {
    if (!addBtn) return;
    const rect = addBtn.getBoundingClientRect();
    setAddInput("");
    setAddPop({ x: rect.right + SIDE_GAP, y: rect.top });
  }

  function closeAdd() {
    setAddPop(null);
    setAddInput("");
  }

  async function submitAdd() {
    const login = addInput().trim().toLowerCase();
    if (!login) return;
    setAddLoading(true);
    const lookup = await users.findByLogin(login);
    setAddLoading(false);
    if (lookup.status === "missing") {
      addToast(t("RAIL_USER_NOT_FOUND"), "error");
      return;
    }
    if (lookup.status === "failed") return;
    if (pinnedChannels().includes(lookup.user.id)) {
      addToast(t("RAIL_ALREADY_PINNED"), "error");
    } else {
      channels.cachePinned(lookup.user);
      pinChannel(lookup.user.id);
    }
    closeAdd();
  }

  function pin(ch: User) {
    channels.cachePinned(ch);
    users.set([ch]);
    pinChannel(ch.id);
  }

  return (
    <nav
      aria-label={t("RAIL_CHANNELS")}
      class={`flex flex-col h-full shrink-0 bg-surface border-r border-line-soft overflow-hidden transition-all duration-settle ease-out ${
        expanded() ? "w-rail-expanded" : "w-rail"
      }`}
    >
      <button
        type="button"
        aria-label={t(expanded() ? "RAIL_COLLAPSE_RAIL" : "RAIL_EXPAND_RAIL")}
        aria-expanded={expanded()}
        onClick={() => setAppearanceRailExpanded(!expanded())}
        class="shrink-0 h-9 mx-2 mt-2 mb-0.5 pl-2 flex items-center gap-3 rounded-sm text-ink-faint hover:bg-raised hover:text-ink cursor-pointer transition-colors duration-snap overflow-hidden"
      >
        <span class="w-10 shrink-0 grid place-items-center">
          <ChevronRight
            class={`size-4 transition-transform duration-quick ${
              expanded() ? "rotate-180" : ""
            }`}
          />
        </span>
        <span
          aria-hidden={!expanded()}
          class={`text-small whitespace-nowrap transition-opacity duration-settle ${
            expanded() ? "opacity-100" : "opacity-0"
          }`}
        >
          {t("RAIL_COLLAPSE")}
        </span>
      </button>

      <div class="relative flex-1 min-h-0">
        <Show when={main.canUp()}>
          <ScrollChevron direction="up" onClick={() => main.scrollByOne(-1)} />
        </Show>
        <Show when={main.canDown()}>
          <ScrollChevron direction="down" onClick={() => main.scrollByOne(1)} />
        </Show>
        <div
          ref={main.setRef}
          onScroll={main.update}
          class="flex flex-col h-full overflow-y-auto scrollbar-none"
        >
          <div class={`flex flex-col py-1.5 ${railGap()}`}>
            <Show
              when={!channels.loadingPinned()}
              fallback={
                <For each={pinnedChannels()}>{() => <RailRowSkeleton />}</For>
              }
            >
              <For each={pinnedChannels()}>
                {(id, index) => {
                  const ch = () => channels.resolveChannel(id);
                  const isOver = () =>
                    overIdx() === index() && dragIdx() !== index();
                  return (
                    <Show when={!warmedIds().has(id) && ch()}>
                      {(c) => (
                        <div
                          data-pinned-index={index()}
                          data-channel-id={id}
                          class="relative"
                          onMouseDown={(e) => startDrag(e, index())}
                        >
                          <Show when={isOver()}>
                            <div class="pointer-events-none absolute left-3 right-3 -top-px h-0.5 bg-accent rounded-full z-10" />
                          </Show>
                          <ChannelRow
                            ch={c()}
                            selected={selectedId() === id}
                            unread={hasUnread(id)}
                            mentions={channelMentionCount(id)}
                            dimmed={dragIdx() === index()}
                            onSelect={() => props.onSelect(c())}
                            onMiddleClick={() => openInBrowser(c())}
                            onContextMenu={(x, y) =>
                              setChMenu({ ch: c(), x, y })
                            }
                          />
                        </div>
                      )}
                    </Show>
                  );
                }}
              </For>
            </Show>
            <RailRow
              ref={(el) => (addBtn = el)}
              label={t("RAIL_PIN_CHANNEL")}
              tooltip={
                <p class="font-semibold whitespace-nowrap">
                  {t("RAIL_PIN_CHANNEL")}
                </p>
              }
              onClick={openAdd}
            >
              <RailTile>
                <Plus />
              </RailTile>
            </RailRow>
          </div>

          <RailDivider />

          <div class={`flex flex-col py-1.5 ${railGap()}`}>
            <Show
              when={!channels.loadingLive()}
              fallback={
                <For each={Array.from({ length: 4 })}>
                  {() => <RailRowSkeleton />}
                </For>
              }
            >
              <For each={channels.onlineList()}>
                {(ch) => (
                  <div data-channel-id={ch?.id}>
                    <ChannelRow
                      ch={ch}
                      selected={selectedId() === ch?.id}
                      unread={hasUnread(ch?.id)}
                      mentions={channelMentionCount(ch?.id)}
                      onSelect={() => props.onSelect(ch)}
                      onMiddleClick={() => openInBrowser(ch)}
                      onContextMenu={(x, y) => setChMenu({ ch, x, y })}
                    />
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>

      <Show when={linkedOthers().length > 0}>
        <RailDivider />
        <div class="flex flex-col py-1.5 shrink-0">
          <div class="relative">
            <Show when={linkScroll.canUp()}>
              <ScrollChevron
                direction="up"
                onClick={() => linkScroll.scrollByOne(-1)}
              />
            </Show>
            <Show when={linkScroll.canDown()}>
              <ScrollChevron
                direction="down"
                onClick={() => linkScroll.scrollByOne(1)}
              />
            </Show>
            <div
              ref={linkScroll.setRef}
              onScroll={linkScroll.update}
              class={`flex max-h-44 flex-col overflow-y-auto scrollbar-none ${railGap()}`}
            >
              <For each={linkedOthers()}>
                {(ch) => (
                  <div data-channel-id={ch?.id}>
                    <ChannelRow
                      ch={ch}
                      selected={selectedId() === ch?.id}
                      unread={hasUnread(ch?.id)}
                      mentions={channelMentionCount(ch?.id)}
                      muted={linkMutedByLogin()[ch?.login] === true}
                      onToggleMute={() => link.toggleMuted(ch?.login)}
                      onSelect={() => props.onSelect(ch)}
                      onMiddleClick={() => void linkClose(ch?.login)}
                      onContextMenu={(x, y) => setChMenu({ ch, x, y })}
                    />
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>

      <Show when={nowViewing()}>
        {(nv) => (
          <>
            <RailDivider />
            <div class="py-1.5 shrink-0" data-channel-id={nv().id}>
              <ChannelRow
                ch={nv()}
                selected={selectedId() === nv().id}
                unread={hasUnread(nv().id)}
                mentions={channelMentionCount(nv().id)}
                ephemeral
                onSelect={() => props.onSelect(nv())}
                onMiddleClick={() => openInBrowser(nv())}
                onContextMenu={(x, y) => setChMenu({ ch: nv(), x, y })}
              />
            </div>
          </>
        )}
      </Show>

      <RailDivider />
      <div class={`flex flex-col py-1.5 shrink-0 ${railGap()}`}>
        <RailRow
          ref={(el) => (linkBtn = el)}
          label={t("SETTINGS_LINK")}
          sub={linkStatus().sub}
          subTone={linkStatus().tone}
          tooltip={
            <p class="font-semibold whitespace-nowrap">
              {t("RAIL_LINK_TOOLTIP", { status: linkStatus().sub })}
            </p>
          }
          onClick={() => linkStatus().onClick?.()}
          onContextMenu={openLinkMenu}
        >
          <RailTile active={linkStatus().tile}>
            <Eye />
          </RailTile>
        </RailRow>
        <RailRow
          label={t("RAIL_EXPLORE")}
          sub={t("RAIL_EXPLORE_SUB")}
          tooltip={
            <p class="font-semibold whitespace-nowrap">{t("RAIL_EXPLORE")}</p>
          }
          selected={activeView() === "explore"}
          onClick={showExplore}
        >
          <RailTile active={activeView() === "explore" && "accent"}>
            <Search />
          </RailTile>
        </RailRow>
        <RailRow
          label={t("SETTINGS_TITLE")}
          sub={t("RAIL_SETTINGS_SUB")}
          tooltip={
            <p class="font-semibold whitespace-nowrap">{t("SETTINGS_TITLE")}</p>
          }
          selected={isSettingsOpen()}
          onClick={toggleSettings}
        >
          <RailTile active={isSettingsOpen() && "accent"}>
            <Settings />
          </RailTile>
        </RailRow>
      </div>

      <RailDivider />
      <div class="flex flex-col pt-1.5 pb-3 shrink-0">
        <Show when={user()}>
          {(u) => (
            <RailRow
              label={u().displayName}
              sub={t("RAIL_YOUR_CHANNEL")}
              tooltip={
                <p class="font-semibold whitespace-nowrap">{u().displayName}</p>
              }
              selected={selectedId() === u().id}
              unread={hasUnread(u().id)}
              mentions={channelMentionCount(u().id)}
              onClick={() => props.onSelect(u())}
              onMiddleClick={() =>
                ownTab() ? void linkClose(u().login) : openInBrowser(u())
              }
              onContextMenu={(x, y) => setChMenu({ ch: u(), x, y })}
            >
              <Avatar
                src={u().profileImageUrl}
                alt={u().displayName}
                size={40}
                square
                presence="online"
              >
                <Show when={ownTab()}>
                  {(tab) => (
                    <TabMuteBadge
                      muted={linkMutedByLogin()[tab().login] === true}
                      onToggle={() => link.toggleMuted(tab().login)}
                    />
                  )}
                </Show>
              </Avatar>
            </RailRow>
          )}
        </Show>
      </div>

      <Show when={linkMenu()}>
        {(m) => (
          <LinkMenu
            x={m().x}
            y={m().y}
            opener={() => linkBtn}
            onClose={() => setLinkMenu(null)}
            onToggleSync={props.onToggleLink}
          />
        )}
      </Show>

      <Show when={chMenu()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            ch={m().ch}
            place="rail"
            onClose={() => setChMenu(null)}
            onPin={pin}
            onLogout={
              m().ch?.id === user()?.id ? () => session.logout() : undefined
            }
          />
        )}
      </Show>

      <Show when={addPop()}>
        {(p) => (
          <InputPopover
            x={p().x}
            y={p().y}
            value={addInput()}
            loading={addLoading()}
            placeholder={t("RAIL_CHANNEL_NAME")}
            onInput={setAddInput}
            onSubmit={submitAdd}
            onClose={closeAdd}
          />
        )}
      </Show>
    </nav>
  );
}
