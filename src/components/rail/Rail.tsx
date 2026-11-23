import { createEffect, createMemo, For, on, Show } from "solid-js";
import { Plus, Search, Settings } from "lucide-solid";
import * as browser from "../../lib/services/browser.ts";
import {
  appearanceRailExpanded,
  pinnedChannels,
} from "../../lib/stores/preferences.ts";
import { hasUnread } from "../../lib/stores/feeds.ts";
import { channelMentionCount } from "../../lib/stores/inbox.ts";
import {
  linkedChannel,
  linkMutedByLogin,
  linkWarmedChannels,
} from "../../lib/stores/link.ts";
import * as link from "../../lib/services/link.ts";
import {
  activeView,
  isSettingsOpen,
  pendingChannel,
  showExplore,
  toggleSettings,
} from "../../lib/stores/view.ts";
import { user } from "../../lib/stores/users.ts";
import { isOwnChannel } from "../../lib/stores/roles.ts";
import { createScrollAffordance } from "./createScrollAffordance.ts";
import { createRailChannels } from "./createRailChannels.ts";
import { createPinDrag } from "./createPinDrag.ts";
import RailRow from "./RailRow.tsx";
import RailTile from "./RailTile.tsx";
import RailDivider from "./RailDivider.tsx";
import RailLinkRow from "./RailLinkRow.tsx";
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

const PLACEHOLDER_ROWS = 4;

export default function Rail(props: Props) {
  const expanded = appearanceRailExpanded;
  const channels = createRailChannels();
  const main = createScrollAffordance();
  const linkScroll = createScrollAffordance();
  const drag = createPinDrag();

  const linkedOthers = () =>
    linkWarmedChannels().filter((c) => !isOwnChannel(c.id));
  const ownTab = () => linkWarmedChannels().find((c) => isOwnChannel(c.id));

  const warmedIds = createMemo(
    () => new Set(linkWarmedChannels().map((c) => c.id)),
  );

  const isListed = (id: string) =>
    new Set(pinnedChannels()).has(id) ||
    warmedIds().has(id) ||
    linkedChannel()?.id === id ||
    channels.isLive(id) ||
    isOwnChannel(id);

  const nowViewing = createMemo(() => {
    const sel = pendingChannel();
    return sel && !isListed(sel.id) ? sel : null;
  });

  const chMenu = createPopover<{ ch: User }>();
  const openMenu = (x: number, y: number, ch: User) =>
    chMenu.open(x, y, { ch });
  const addPop = createPopover();
  let addBtn: HTMLButtonElement | undefined;

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
                {(id, index) => (
                  <Show
                    when={!warmedIds().has(id) && channels.resolveChannel(id)}
                  >
                    {(c) => (
                      <div
                        data-pinned-index={index()}
                        data-channel-id={id}
                        class="relative"
                        onMouseDown={(e) => drag.start(e, index())}
                      >
                        <Show when={drag.isOver(index())}>
                          <div class="pointer-events-none absolute left-2 right-2 -top-px h-0.5 rounded-full bg-accent z-10" />
                        </Show>
                        <ChannelRow
                          ch={c()}
                          dimmed={drag.isDragging(index())}
                          onSelect={props.onSelect}
                          onContextMenu={openMenu}
                        />
                      </div>
                    )}
                  </Show>
                )}
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
                <For each={Array.from({ length: PLACEHOLDER_ROWS })}>
                  {() => <RailRowSkeleton />}
                </For>
              }
            >
              <For each={channels.onlineList()}>
                {(ch) => (
                  <div data-channel-id={ch.id}>
                    <ChannelRow
                      ch={ch}
                      onSelect={props.onSelect}
                      onContextMenu={openMenu}
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
                      muted={linkMutedByLogin()[ch.login] === true}
                      onToggleMute={() => link.toggleMuted(ch.login)}
                      onSelect={props.onSelect}
                      onMiddleClick={() => link.close(ch.login)}
                      onContextMenu={openMenu}
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
                ephemeral
                onSelect={props.onSelect}
                onContextMenu={openMenu}
              />
            </div>
          </>
        )}
      </Show>

      <RailDivider />
      <div class={`flex flex-col py-2 shrink-0 ${railGap()}`}>
        <RailLinkRow onToggleLink={props.onToggleLink} />
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
              selected={pendingChannel()?.id === u().id}
              unread={hasUnread(u().id)}
              mentions={channelMentionCount(u().id)}
              onClick={() => props.onSelect(u())}
              onMiddleClick={() => {
                if (ownTab()) link.close(u().login);
                else browser.openChannel(u().login);
              }}
              onContextMenu={(x, y) => openMenu(x, y, u())}
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

      <Show when={chMenu.state()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            ch={m().ch}
            place="rail"
            onClose={chMenu.close}
            onLogout={
              isOwnChannel(m().ch.id) ? () => session.logout() : undefined
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
