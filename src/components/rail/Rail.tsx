import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { Eye, Plus, Search, Settings } from "lucide-solid";
import * as browser from "../../lib/services/browser.ts";
import {
  appearanceRailExpanded,
  linkAudioLink,
  pinnedChannels,
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
import * as link from "../../lib/services/link.ts";
import * as pins from "../../lib/services/pins.ts";
import {
  activeView,
  isSettingsOpen,
  linkSynced,
  pendingChannel,
  selectedChannel,
  showExplore,
  toggleSettings,
} from "../../lib/stores/view.ts";
import { user } from "../../lib/stores/users.ts";
import { createScrollAffordance } from "./createScrollAffordance.ts";
import { createRailChannels } from "./createRailChannels.ts";
import RailRow, { type SubTone } from "./RailRow.tsx";
import RailTile, { type TileTone } from "./RailTile.tsx";
import RailDivider from "./RailDivider.tsx";
import TipLabel from "../ui/TipLabel.tsx";
import ChannelRow from "./ChannelRow.tsx";
import Avatar from "../ui/Avatar.tsx";
import ScrollChevron from "./ScrollChevron.tsx";
import RailRowSkeleton from "./RailRowSkeleton.tsx";
import { railGap } from "../ui/rowHeight.ts";
import TabMuteBadge from "./TabMuteBadge.tsx";
import PinChannelPopover from "./PinChannelPopover.tsx";
import { SIDE_GAP } from "../ui/Popover.tsx";
import ChannelContextMenu from "../context-menus/ChannelContextMenu.tsx";
import { createPopover } from "../ui/createPopover.ts";
import * as session from "../../lib/services/session.ts";
import type { User } from "../../lib/types/index.ts";
import { t } from "../../lib/i18n/index.ts";
import { scrollBehavior } from "../ui/scrollBehavior.ts";
import Presence from "../ui/Presence.tsx";

type Props = {
  onSelect: (ch: User) => void;
  onToggleLink: () => void;
};

type LinkStatus = {
  sub: string;
  tone: SubTone;
  tile: TileTone | false;
  onClick?: () => void;
};

export default function Rail(props: Props) {
  const expanded = appearanceRailExpanded;
  const channels = createRailChannels();
  const main = createScrollAffordance();
  const linkScroll = createScrollAffordance();

  const selectedId = () => {
    const v = activeView();
    return typeof v === "object" ? v.id : null;
  };

  const linkedOthers = () =>
    linkWarmedChannels().filter((c) => c.id !== user()?.id);
  const ownTab = () => linkWarmedChannels().find((c) => c.id === user()?.id);

  const warmedIds = createMemo(
    () => new Set(linkWarmedChannels().map((c) => c.id)),
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

  const linkStatus = (): LinkStatus => {
    if (!linkConnected()) {
      return {
        sub: t("RAIL_LINK_ADD_FIREFOX_LABEL"),
        tone: "soft",
        tile: false,
        onClick: openLinkMenu,
      };
    }
    if (linkWarmedChannels().length === 0) {
      return { sub: t("RAIL_LINK_NO_TABS_EMPTY"), tone: "soft", tile: false };
    }
    if (linkSynced()) {
      return {
        sub: t(
          linkAudioLink()
            ? "RAIL_LINK_SYNCED_AUDIO_STATUS"
            : "RAIL_LINK_SYNCED_STATUS",
        ),
        tone: "positive",
        tile: "positive",
        onClick: props.onToggleLink,
      };
    }
    return {
      sub: t("RAIL_LINK_NOT_SYNCED_STATUS"),
      tone: "soft",
      tile: false,
      onClick: props.onToggleLink,
    };
  };

  const chMenu = createPopover<{ ch: User }>();
  const addPop = createPopover();
  const [dragIdx, setDragIdx] = createSignal<number | null>(null);
  const [overIdx, setOverIdx] = createSignal<number | null>(null);
  let addBtn: HTMLButtonElement | undefined;
  const linkMenu = createPopover();
  let linkBtn: HTMLButtonElement | undefined;

  function openLinkMenu() {
    if (!linkBtn || linkMenu.state()) return linkMenu.close();
    const rect = linkBtn.getBoundingClientRect();
    linkMenu.open(rect.right + SIDE_GAP, rect.top, {});
  }

  createEffect(
    on([pinnedChannels, () => channels.onlineList().length, expanded], () =>
      queueMicrotask(main.update),
    ),
  );

  createEffect(
    on(
      () => linkWarmedChannels().length,
      () => queueMicrotask(linkScroll.update),
    ),
  );

  createEffect(() => {
    const sel = pendingChannel();
    if (!sel) return;
    queueMicrotask(() => {
      const targets = document.querySelectorAll<HTMLElement>(
        `[data-channel-id="${sel.id}"]`,
      );
      for (const target of targets) {
        target.scrollIntoView({
          block: "nearest",
          behavior: scrollBehavior(),
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
        ?.closest<HTMLElement>("[data-pinned-index]");
      const index = row?.dataset.pinnedIndex;
      const i = index === undefined ? null : parseInt(index);
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
      if (over !== null && over !== idx) pins.move(idx, over);
      end();
    };
    endDrag = end;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }
  let endDrag: (() => void) | undefined;
  onCleanup(() => endDrag?.());

  function toggleAdd() {
    if (addPop.state()) return addPop.close();
    if (!addBtn) return;
    const rect = addBtn.getBoundingClientRect();
    addPop.open(rect.right + SIDE_GAP, rect.top, {});
  }

  return (
    <nav
      aria-label={t("RAIL_CHANNELS_LABEL")}
      class={`flex flex-col h-full shrink-0 bg-surface overflow-hidden transition-all duration-settle ease-drawer ${
        expanded() ? "w-rail-expanded" : "w-rail"
      }`}
    >
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
          <div class={`flex flex-col py-2 ${railGap()}`}>
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
                            <div class="pointer-events-none absolute left-2 right-2 -top-px h-0.5 rounded-full bg-accent z-10" />
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
                              chMenu.open(x, y, { ch: c() })
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
              label={t("RAIL_PIN_CHANNEL_LABEL")}
              sub={t("RAIL_PIN_CHANNEL_DESCRIPTION")}
              onClick={toggleAdd}
            >
              <RailTile>
                <Plus />
              </RailTile>
            </RailRow>
          </div>

          <RailDivider
            label={t("RAIL_SECTION_LIVE_TITLE", {
              count: channels.onlineList().length,
            })}
          />

          <div class={`flex flex-col py-2 ${railGap()}`}>
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
                  <div data-channel-id={ch.id}>
                    <ChannelRow
                      ch={ch}
                      selected={selectedId() === ch.id}
                      unread={hasUnread(ch.id)}
                      mentions={channelMentionCount(ch.id)}
                      onSelect={() => props.onSelect(ch)}
                      onMiddleClick={() => openInBrowser(ch)}
                      onContextMenu={(x, y) => chMenu.open(x, y, { ch })}
                    />
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>

      <Show when={linkedOthers().length > 0}>
        <RailDivider label={t("RAIL_SECTION_TABS_TITLE")} />
        <div class="flex flex-col py-2 shrink-0">
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
                  <div data-channel-id={ch.id}>
                    <ChannelRow
                      ch={ch}
                      selected={selectedId() === ch.id}
                      unread={hasUnread(ch.id)}
                      mentions={channelMentionCount(ch.id)}
                      muted={linkMutedByLogin()[ch.login] === true}
                      onToggleMute={() => link.toggleMuted(ch.login)}
                      onSelect={() => props.onSelect(ch)}
                      onMiddleClick={() => link.close(ch.login)}
                      onContextMenu={(x, y) => chMenu.open(x, y, { ch })}
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
            <RailDivider label={t("RAIL_SECTION_VIEWING_TITLE")} />
            <div class="py-2 shrink-0" data-channel-id={nv().id}>
              <ChannelRow
                ch={nv()}
                selected={selectedId() === nv().id}
                unread={hasUnread(nv().id)}
                mentions={channelMentionCount(nv().id)}
                ephemeral
                onSelect={() => props.onSelect(nv())}
                onMiddleClick={() => openInBrowser(nv())}
                onContextMenu={(x, y) => chMenu.open(x, y, { ch: nv() })}
              />
            </div>
          </>
        )}
      </Show>

      <RailDivider />
      <div class={`flex flex-col py-2 shrink-0 ${railGap()}`}>
        <RailRow
          ref={(el) => (linkBtn = el)}
          label={t("RAIL_LINK_LABEL")}
          sub={linkStatus().sub}
          subTone={linkStatus().tone}
          tooltip={
            <TipLabel>
              {t("RAIL_LINK_STATUS_HINT", { status: linkStatus().sub })}
            </TipLabel>
          }
          onClick={() => linkStatus().onClick?.()}
          onContextMenu={openLinkMenu}
        >
          <RailTile active={linkStatus().tile}>
            <Eye />
          </RailTile>
        </RailRow>
        <RailRow
          label={t("RAIL_EXPLORE_LABEL")}
          sub={t("RAIL_EXPLORE_DESCRIPTION")}
          selected={activeView() === "explore"}
          onClick={showExplore}
        >
          <RailTile active={activeView() === "explore" && "accent"}>
            <Search />
          </RailTile>
        </RailRow>
        <RailRow
          label={t("RAIL_SETTINGS_LABEL")}
          sub={t("RAIL_SETTINGS_DESCRIPTION")}
          selected={isSettingsOpen()}
          onClick={toggleSettings}
        >
          <RailTile active={isSettingsOpen() && "accent"}>
            <Settings />
          </RailTile>
        </RailRow>
      </div>

      <RailDivider />
      <div class="flex flex-col py-2 shrink-0">
        <Show when={user()}>
          {(u) => (
            <RailRow
              label={u().displayName}
              sub={t("RAIL_YOUR_CHANNEL_LABEL")}
              selected={selectedId() === u().id}
              unread={hasUnread(u().id)}
              mentions={channelMentionCount(u().id)}
              onClick={() => props.onSelect(u())}
              onMiddleClick={() => {
                if (ownTab()) link.close(u().login);
                else openInBrowser(u());
              }}
              onContextMenu={(x, y) => chMenu.open(x, y, { ch: u() })}
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

      <Show when={linkMenu.state()}>
        {(m) => (
          <LinkMenu
            x={m().x}
            y={m().y}
            opener={() => linkBtn}
            onClose={linkMenu.close}
            onToggleSync={props.onToggleLink}
          />
        )}
      </Show>

      <Show when={chMenu.state()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            ch={m().ch}
            place="rail"
            onClose={chMenu.close}
            onLogout={
              m().ch.id === user()?.id ? () => session.logout() : undefined
            }
          />
        )}
      </Show>

      <Presence when={addPop.state()}>
        {(p) => (
          <PinChannelPopover
            x={p().x}
            y={p().y}
            opener={() => addBtn}
            onClose={addPop.close}
          />
        )}
      </Presence>
    </nav>
  );
}
