import { createEffect, createMemo, For, on, Show } from "solid-js";
import {
  EyeOff,
  House,
  Inbox as InboxIcon,
  Plus,
  Radio,
  Search,
  Settings,
} from "lucide-solid";
import * as browser from "../../platform/browser.ts";
import {
  appearanceRailExpanded,
  linkEnabled,
  pinnedChannels,
  systemFollowedChannels,
  appearanceFollowedPrompt,
  setAppearanceFollowedPrompt,
  setSystemFollowedChannels,
} from "../preferences/index.ts";
import { hasUnread } from "../feed/index.ts";
import * as inbox from "../inbox/index.ts";
import * as link from "../link/index.ts";
import {
  activeView,
  isSettingsOpen,
  pendingChannel,
  showExplore,
  showHome,
  showInbox,
  toggleSettings,
} from "../navigation/index.ts";
import { user } from "../users/index.ts";
import { isOwnChannel } from "../permissions/index.ts";
import { createScrollAffordance } from "./createScrollAffordance.ts";
import { createRailChannels } from "./createRailChannels.ts";
import { createPinDrag } from "./createPinDrag.ts";
import RailRow from "./RailRow.tsx";
import IconTile from "../../kit/IconTile.tsx";
import RailLinkRow from "./RailLinkRow.tsx";
import ChannelRow from "./ChannelRow.tsx";
import StreamTooltip from "./StreamTooltip.tsx";
import { channelInfoFor, streamForUserId } from "../channels/index.ts";
import Avatar from "../../kit/Avatar.tsx";
import { avatarZoom } from "../../shared/avatar.ts";
import ScrollChevron from "./ui/ScrollChevron.tsx";
import RailRowSkeleton from "./RailRowSkeleton.tsx";
import { TabMuteBadge } from "../link/index.ts";
import PinChannelPopover from "./PinChannelPopover.tsx";
import { SIDE_GAP } from "../../kit/Popover.tsx";
import { ChannelContextMenu } from "../menus/index.ts";
import { createPopover } from "../../kit/createPopover.ts";
import Menu from "../../kit/Menu.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import * as session from "../login/index.ts";
import type { User } from "../../shared/types/index.ts";
import { t } from "../../shared/i18n/index.ts";
import { scrollBehavior } from "../../kit/scrollBehavior.ts";
import Transition from "../../kit/Transition.tsx";
import Divider from "../../kit/Divider.tsx";

type Props = {
  onSelect: (ch: User) => void;
  onToggleLink: () => void;
};

const PLACEHOLDER_ROWS = 4;
const RESERVED_ROWS = [
  "rail-reserve-0",
  "rail-reserve-1",
  "rail-reserve-2",
  "rail-reserve-3",
  "rail-reserve-4",
] as const;

export default function Rail(props: Props) {
  const expanded = appearanceRailExpanded;
  const channels = createRailChannels();
  const main = createScrollAffordance();
  const linkScroll = createScrollAffordance();
  const drag = createPinDrag();

  const linkedOthers = () => link.tabs().filter((c) => !isOwnChannel(c.id));
  const listedRows = () =>
    pinnedChannels().length +
    (channels.loadingLive() ? PLACEHOLDER_ROWS : channels.onlineList().length);
  const reserved = () =>
    RESERVED_ROWS[Math.min(listedRows(), RESERVED_ROWS.length - 1)];
  const ownTab = () => link.tabs().find((c) => isOwnChannel(c.id));

  const nowViewing = createMemo(() => {
    const sel = pendingChannel();
    return sel && !channels.isListed(sel.id) ? sel : null;
  });

  const chMenu = createPopover<{ ch: User }>();
  const openMenu = (x: number, y: number, ch: User) =>
    chMenu.open(x, y, { ch });
  const addPop = createPopover();
  const promptMenu = createPopover();
  let addBtn: HTMLButtonElement | undefined;

  createEffect(
    on([pinnedChannels, () => channels.onlineList().length, expanded], () =>
      queueMicrotask(main.update),
    ),
  );

  createEffect(
    on(
      () => link.tabs().length,
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
      <div class="flex flex-col py-2 shrink-0">
        <RailRow
          label={t("RAIL_HOME_LABEL")}
          sub={t("RAIL_HOME_DESCRIPTION")}
          selected={activeView() === "home"}
          onClick={showHome}
        >
          <IconTile active={activeView() === "home" && "accent"}>
            <House />
          </IconTile>
        </RailRow>
      </div>
      <Divider class="mx-4" />
      <div class={`relative ${reserved()}`}>
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
          <div class={`flex flex-col py-2 gap-row-gap`}>
            <Show
              when={!channels.loadingPinned()}
              fallback={
                <For each={pinnedChannels()}>{() => <RailRowSkeleton />}</For>
              }
            >
              <For each={pinnedChannels()}>
                {(id, index) => (
                  <Show
                    when={!channels.isTab(id) && channels.resolveChannel(id)}
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
              <IconTile>
                <Plus />
              </IconTile>
            </RailRow>
          </div>

          <Show
            when={systemFollowedChannels()}
            fallback={
              <Show when={appearanceFollowedPrompt()}>
                <Divider class="mx-4" />
                <div class="flex flex-col py-2">
                  <RailRow
                    label={t("RAIL_SHOW_FOLLOWED_LABEL")}
                    sub={t("RAIL_SHOW_FOLLOWED_DESCRIPTION", {
                      count: channels.followedLiveCount(),
                    })}
                    onClick={() => setSystemFollowedChannels(true)}
                    onContextMenu={(x, y) => promptMenu.open(x, y, {})}
                  >
                    <IconTile>
                      <Radio />
                    </IconTile>
                  </RailRow>
                </div>
              </Show>
            }
          >
            <Divider class="mx-4" />

            <div class={`flex flex-col py-2 gap-row-gap`}>
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
          </Show>
        </div>
      </div>

      <Show when={linkedOthers().length > 0}>
        <Divider class="mx-4" />
        <div class="flex flex-col py-2 rail-tabs">
          <div class="relative flex flex-col min-h-0">
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
              class={`flex min-h-0 flex-col overflow-y-auto scrollbar-none gap-row-gap`}
            >
              <For each={linkedOthers()}>
                {(ch) => (
                  <div data-channel-id={ch.id}>
                    <ChannelRow
                      ch={ch}
                      muted={link.mutedByLogin()[ch.login] === true}
                      earnedAt={link.earnedAt(ch.id)}
                      onToggleMute={
                        link.hasAudio()
                          ? () => link.toggleMuted(ch.login)
                          : undefined
                      }
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
            <Divider class="mx-4" />
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

      <Divider class="mx-4" />
      <div class={`flex flex-col py-2 shrink-0 gap-row-gap`}>
        <Show when={linkEnabled()}>
          <RailLinkRow onToggleLink={props.onToggleLink} />
        </Show>
        <RailRow
          label={t("RAIL_EXPLORE_LABEL")}
          sub={t("RAIL_EXPLORE_DESCRIPTION")}
          selected={activeView() === "explore"}
          onClick={showExplore}
        >
          <IconTile active={activeView() === "explore" && "accent"}>
            <Search />
          </IconTile>
        </RailRow>
        <RailRow
          label={t("RAIL_INBOX_LABEL")}
          sub={t("RAIL_INBOX_DESCRIPTION")}
          selected={activeView() === "inbox"}
          count={inbox.unreadCount()}
          onClick={showInbox}
        >
          <IconTile active={activeView() === "inbox" && "accent"}>
            <InboxIcon />
          </IconTile>
        </RailRow>
        <RailRow
          label={t("RAIL_SETTINGS_LABEL")}
          sub={t("RAIL_SETTINGS_DESCRIPTION")}
          selected={isSettingsOpen()}
          onClick={toggleSettings}
        >
          <IconTile active={isSettingsOpen() && "accent"}>
            <Settings />
          </IconTile>
        </RailRow>
      </div>

      <Divider class="mx-4" />
      <div class="flex flex-col py-2 shrink-0">
        <Show when={user()}>
          {(u) => (
            <RailRow
              label={u().displayName}
              sub={t("RAIL_YOUR_CHANNEL_LABEL")}
              card={() => (
                <StreamTooltip
                  user={u()}
                  stream={streamForUserId(u().id)}
                  info={channelInfoFor(u().id)}
                />
              )}
              selected={pendingChannel()?.id === u().id}
              unread={hasUnread(u().id)}
              count={inbox.unreadCountIn(u().id)}
              onClick={() => props.onSelect(u())}
              onMiddleClick={() => {
                if (ownTab()) link.close(u().login);
                else browser.openChannel(u().login);
              }}
              onContextMenu={(x, y) => openMenu(x, y, u())}
            >
              <Avatar
                src={u().profileImageUrl}
                zoom={avatarZoom(u().profileImageUrl)}
                alt={u().displayName}
                size="md"
                square
                ring={streamForUserId(u().id) ? "negative" : undefined}
              >
                <Show when={link.hasAudio() && ownTab()}>
                  {(tab) => (
                    <TabMuteBadge
                      muted={link.mutedByLogin()[tab().login] === true}
                      onToggle={() => link.toggleMuted(tab().login)}
                    />
                  )}
                </Show>
              </Avatar>
            </RailRow>
          )}
        </Show>
      </div>

      <Show when={chMenu.state()} keyed>
        {(m) => (
          <ChannelContextMenu
            x={m.x}
            y={m.y}
            ch={m.ch}
            place="rail"
            onClose={chMenu.close}
            onLogout={
              isOwnChannel(m.ch.id) ? () => session.logout() : undefined
            }
          />
        )}
      </Show>

      <Show when={promptMenu.state()}>
        {(m) => (
          <Menu x={m().x} y={m().y} onClose={promptMenu.close}>
            <MenuItem
              label={t("RAIL_SHOW_FOLLOWED_HIDE_LABEL")}
              icon={<EyeOff />}
              onClick={() => setAppearanceFollowedPrompt(false)}
            />
          </Menu>
        )}
      </Show>

      <Transition when={addPop.state()}>
        {(p) => (
          <PinChannelPopover
            x={p().x}
            y={p().y}
            opener={() => addBtn}
            onClose={addPop.close}
          />
        )}
      </Transition>
    </nav>
  );
}
