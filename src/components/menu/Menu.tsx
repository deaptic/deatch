import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { Compass, Eye, Pin, Plus, Volume2, VolumeOff } from "lucide-solid";
import { openUrl } from "@tauri-apps/plugin-opener";
import { rememberUser, streamForUserId } from "../../lib/stores/channels.ts";
import {
  advancedDeveloperMode,
  menuChannelPinned,
  pinChannel,
  reorderPinnedChannels,
  unpinChannel,
} from "../../lib/stores/preferences.ts";
import { hasUnread } from "../../lib/stores/feeds.ts";
import { channelMentionCount } from "../../lib/stores/inbox.ts";
import {
  watchMutedByLogin,
  watchWarmedChannels,
} from "../../lib/stores/watch.ts";
import { watchSetMuted } from "../../lib/api/watch.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import {
  activeView,
  pendingChannel,
  selectedChannel,
  showExplore,
  watchMode,
} from "../../lib/stores/view.ts";
import { getUsers } from "../../lib/api/twitch/users.ts";
import { beginRaid } from "../../lib/stores/raid.ts";
import { user } from "../../lib/stores/users.ts";
import { formatViewers } from "../../lib/format/stream.ts";
import { createScrollAffordance } from "../../lib/primitives/createScrollAffordance.ts";
import { createMenuChannels } from "./createMenuChannels.ts";
import MenuGroup from "./MenuGroup.tsx";
import MenuItem from "./MenuItem.tsx";
import Avatar from "../ui/Avatar.tsx";
import Divider from "../ui/Divider.tsx";
import ScrollChevron from "../ui/ScrollChevron.tsx";
import InputPopover from "../ui/InputPopover.tsx";
import ChannelContextMenu from "../context-menus/ChannelContextMenu.tsx";
import type { Stream } from "../../lib/types/twitch/stream.ts";
import type { User } from "../../lib/types/twitch/user.ts";

type Props = {
  onSelect: (ch: User) => void;
  onToggleWatch: () => void;
  onLiveChange?: (live: User[]) => void;
};

function StreamTooltip(props: { user: User; stream?: Stream }) {
  return (
    <>
      <p class="text-text text-sm font-semibold whitespace-nowrap truncate">
        {props.user.displayName}
        <Show when={props.stream?.game.name}>
          <span class="text-text-muted font-normal">
            {" "}
            - {props.stream!.game.name}
          </span>
        </Show>
      </p>
      <Show when={props.stream?.title}>
        <p class="text-text-muted text-xs mt-0.5 wrap-break-word">
          {props.stream!.title}
        </p>
      </Show>
      <Show when={props.stream}>
        <div class="flex items-center gap-1.5 mt-1">
          <div class="size-1.5 rounded-full bg-danger" />
          <span class="text-danger text-xs font-medium whitespace-nowrap">
            Live | {formatViewers(props.stream!.viewerCount)} viewers
          </span>
        </div>
      </Show>
    </>
  );
}

function ChannelItem(props: {
  ch: User;
  selected: boolean;
  unread?: boolean;
  mentions?: number;
  dimmed?: boolean;
  muted?: boolean;
  ephemeral?: boolean;
  onToggleMute?: () => void;
  onPin?: () => void;
  onSelect: () => void;
  onOpenInBrowser: () => void;
  onContextMenu: (x: number, y: number) => void;
}) {
  return (
    <MenuItem
      tooltip={
        <StreamTooltip
          user={props.ch}
          stream={streamForUserId(props.ch.id)}
        />
      }
      selected={props.selected}
      unread={props.unread}
      mentions={props.mentions}
      dimmed={props.dimmed}
      bar
      onClick={props.onSelect}
      onMiddleClick={props.onOpenInBrowser}
      onContextMenu={props.onContextMenu}
    >
      <div
        class="relative size-10"
        classList={{
          "rounded-xl outline-2 outline-dashed outline-offset-2 outline-border-muted":
            props.ephemeral,
        }}
      >
        <Avatar
          src={props.ch?.profileImageUrl}
          alt={props.ch?.displayName}
          class="size-10 rounded-xl"
        />
        <div
          class="absolute -bottom-1 -right-1 size-3.5 flex items-center justify-center overflow-hidden rounded-full border-2 border-bg-dark"
          classList={{
            "bg-success": !!streamForUserId(props.ch.id),
            "bg-highlight": !streamForUserId(props.ch.id),
          }}
        />
        <Show when={props.onPin}>
          <div
            role="button"
            tabindex="0"
            title="Pin channel"
            onClick={(e) => {
              e.stopPropagation();
              props.onPin!();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            class="absolute -top-1 -right-1 size-4.5 rounded-full border-2 border-bg-dark bg-bg-light text-text hover:bg-border-muted flex items-center justify-center transition-colors cursor-pointer"
          >
            <Pin class="size-3" />
          </div>
        </Show>
        <Show when={props.onToggleMute}>
          <div
            role="button"
            tabindex="0"
            title={props.muted ? "Unmute browser tab" : "Mute browser tab"}
            onClick={(e) => {
              e.stopPropagation();
              props.onToggleMute!();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            class={`absolute -top-1 -right-1 size-4.5 rounded-full border-2 border-bg-dark flex items-center justify-center transition-colors cursor-pointer ${
              props.muted
                ? "bg-danger text-text"
                : "bg-bg-light text-text hover:bg-border-muted"
            }`}
          >
            <Show when={props.muted} fallback={<Volume2 class="size-3" />}>
              <VolumeOff class="size-3" />
            </Show>
          </div>
        </Show>
      </div>
    </MenuItem>
  );
}

function Skeleton() {
  return (
    <div class="w-full h-12 flex items-center justify-center">
      <div class="size-10 rounded-xl bg-bg-light animate-pulse" />
    </div>
  );
}

export default function Menu(props: Props) {
  const channels = createMenuChannels(props.onLiveChange);
  const main = createScrollAffordance();
  const watch = createScrollAffordance();

  const selectedId = () => {
    const v = activeView();
    return typeof v === "object" ? v.id : v;
  };

  const warmedIds = createMemo(
    () => new Set(watchWarmedChannels().map((c) => c?.id)),
  );

  const isListed = (id: string) =>
    new Set(menuChannelPinned()).has(id) ||
    warmedIds().has(id) ||
    channels.isLive(id) ||
    id === user()?.id;

  const nowViewing = createMemo(() => {
    const sel = selectedChannel();
    return sel && !isListed(sel.id) ? sel : null;
  });

  const [chMenu, setChMenu] = createSignal<
    { ch: User; x: number; y: number } | null
  >(null);
  const [addPop, setAddPop] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  const [addInput, setAddInput] = createSignal("");
  const [addLoading, setAddLoading] = createSignal(false);
  const [dragIdx, setDragIdx] = createSignal<number | null>(null);
  const [overIdx, setOverIdx] = createSignal<number | null>(null);
  let addBtn: HTMLButtonElement | undefined;

  createEffect(() => {
    menuChannelPinned();
    channels.onlineList().length;
    queueMicrotask(main.update);
  });

  createEffect(() => {
    watchWarmedChannels().length;
    queueMicrotask(watch.update);
  });

  createEffect(() => {
    const sel = pendingChannel();
    if (!sel) return;
    queueMicrotask(() => {
      const targets = document.querySelectorAll(
        `[data-channel-id="${sel.id}"]`,
      );
      for (const t of targets) {
        (t as HTMLElement).scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    });
  });

  function select(ch: User) {
    props.onSelect(ch);
  }

  function openInBrowser(ch: User) {
    openUrl(`https://twitch.tv/${ch?.login}`);
  }

  function raidChannel(ch: User) {
    const self = user();
    if (!self) return;
    beginRaid(self.id, ch).catch(() => {});
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
    const onUp = () => {
      const over = overIdx();
      if (over !== null && over !== idx) reorderPinnedChannels(idx, over);
      setDragIdx(null);
      setOverIdx(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function openAdd() {
    if (!addBtn) return;
    const rect = addBtn.getBoundingClientRect();
    setAddInput("");
    setAddPop({ x: rect.right + 8, y: rect.top });
  }

  function closeAdd() {
    setAddPop(null);
    setAddInput("");
  }

  async function submitAdd() {
    const login = addInput().trim().toLowerCase();
    if (!login) return;
    setAddLoading(true);
    try {
      const users = await getUsers({ logins: [login] });
      const u = users[0];
      if (!u) throw new Error("User not found");
      if (menuChannelPinned().includes(u.id)) {
        addToast("Already pinned", "error");
        closeAdd();
        return;
      }
      channels.cachePinned(u);
      rememberUser(u);
      pinChannel(u.id);
      closeAdd();
    } catch (e) {
      addToast(String(e), "error");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div class="flex flex-col h-full w-16 shrink-0 bg-bg-dark border-r border-border-muted overflow-hidden">
      <MenuGroup>
        <MenuItem
          tooltip={
            <p class="text-text text-sm font-semibold whitespace-nowrap">
              Explore
            </p>
          }
          selected={activeView() === "explore"}
          onClick={showExplore}
        >
          <div
            class="size-10 flex items-center justify-center rounded-xl transition-colors"
            classList={{
              "bg-primary/20 text-primary": activeView() === "explore",
              "bg-bg text-text-muted hover:bg-primary/20 hover:text-primary":
                activeView() !== "explore",
            }}
          >
            <Compass class="size-5" />
          </div>
        </MenuItem>
      </MenuGroup>

      <Divider />

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
          class="flex flex-col h-full overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <MenuGroup>
            <Show
              when={!channels.loadingPinned()}
              fallback={
                <For each={menuChannelPinned()}>{() => <Skeleton />}</For>
              }
            >
              <For each={menuChannelPinned()}>
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
                            <div class="pointer-events-none absolute left-1 right-1 -top-px h-0.5 bg-primary rounded-full z-10" />
                          </Show>
                          <ChannelItem
                            ch={c()}
                            selected={selectedId() === id}
                            unread={hasUnread(id)}
                            mentions={channelMentionCount(id)}
                            dimmed={dragIdx() === index()}
                            onSelect={() => select(c())}
                            onOpenInBrowser={() => openInBrowser(c())}
                            onContextMenu={(x, y) =>
                              setChMenu({ ch: c(), x, y })}
                          />
                        </div>
                      )}
                    </Show>
                  );
                }}
              </For>
            </Show>
            <MenuItem
              ref={(el) => (addBtn = el)}
              tooltip={
                <p class="text-text text-sm font-semibold whitespace-nowrap">
                  Pin a channel
                </p>
              }
              onClick={openAdd}
            >
              <div class="size-10 rounded-xl bg-bg flex items-center justify-center text-text-muted transition-colors hover:bg-primary/20 hover:text-primary">
                <Plus class="size-5" />
              </div>
            </MenuItem>
          </MenuGroup>

          <Divider />

          <MenuGroup>
            <Show
              when={!channels.loadingLive()}
              fallback={
                <For each={Array.from({ length: 4 })}>{() => <Skeleton />}</For>
              }
            >
              <For each={channels.onlineList()}>
                {(ch) => (
                  <div data-channel-id={ch?.id}>
                    <ChannelItem
                      ch={ch}
                      selected={selectedId() === ch?.id}
                      unread={hasUnread(ch?.id)}
                      mentions={channelMentionCount(ch?.id)}
                      onSelect={() => select(ch)}
                      onOpenInBrowser={() => openInBrowser(ch)}
                      onContextMenu={(x, y) => setChMenu({ ch, x, y })}
                    />
                  </div>
                )}
              </For>
            </Show>
          </MenuGroup>
        </div>
      </div>

      <Show when={watchWarmedChannels().length > 0}>
        <Divider />
        <div class="flex flex-col py-1">
          <MenuItem
            tooltip={
              <p class="text-text text-sm font-semibold whitespace-nowrap">
                {watchMode() === "auto"
                  ? "Watch (Auto)"
                  : watchMode() === "manual"
                  ? "Watch (Manual)"
                  : "Watch (Disabled)"}
              </p>
            }
            selected={watchMode() !== null}
            onClick={props.onToggleWatch}
          >
            <div
              class="size-10 flex items-center justify-center rounded-xl transition-colors"
              classList={{
                "bg-success/20 text-success": watchMode() === "auto",
                "bg-warning/20 text-warning": watchMode() === "manual",
                "bg-bg text-text-muted hover:bg-primary/20 hover:text-primary":
                  watchMode() === null,
              }}
            >
              <Eye class="size-5" />
            </div>
          </MenuItem>
          <div class="relative">
            <Show when={watch.canUp()}>
              <ScrollChevron
                direction="up"
                onClick={() => watch.scrollByOne(-1)}
              />
            </Show>
            <Show when={watch.canDown()}>
              <ScrollChevron
                direction="down"
                onClick={() => watch.scrollByOne(1)}
              />
            </Show>
            <div
              ref={watch.setRef}
              onScroll={watch.update}
              class="flex max-h-36 flex-col overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
            >
              <For each={watchWarmedChannels()}>
                {(ch) => (
                  <div data-channel-id={ch?.id}>
                    <ChannelItem
                      ch={ch}
                      selected={selectedId() === ch?.id}
                      muted={watchMutedByLogin()[ch?.login] === true}
                      onToggleMute={() =>
                        void watchSetMuted(
                          ch?.login,
                          watchMutedByLogin()[ch?.login] !== true,
                        )}
                      onSelect={() => select(ch)}
                      onOpenInBrowser={() => openInBrowser(ch)}
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
            <Divider />
            <MenuGroup>
              <div data-channel-id={nv().id}>
                <ChannelItem
                  ch={nv()}
                  selected={selectedId() === nv().id}
                  unread={hasUnread(nv().id)}
                  mentions={channelMentionCount(nv().id)}
                  ephemeral
                  onPin={() => {
                    channels.cachePinned(nv());
                    rememberUser(nv());
                    pinChannel(nv().id);
                  }}
                  onSelect={() => select(nv())}
                  onOpenInBrowser={() => openInBrowser(nv())}
                  onContextMenu={(x, y) => setChMenu({ ch: nv(), x, y })}
                />
              </div>
            </MenuGroup>
          </>
        )}
      </Show>

      <Show when={user()}>
        {(u) => (
          <>
            <Divider />
            <MenuGroup>
              <ChannelItem
                ch={u()}
                selected={selectedId() === u().id}
                unread={hasUnread(u().id)}
                mentions={channelMentionCount(u().id)}
                onSelect={() => select(u())}
                onOpenInBrowser={() => openInBrowser(u())}
                onContextMenu={(x, y) => setChMenu({ ch: u(), x, y })}
              />
            </MenuGroup>
          </>
        )}
      </Show>

      <Show when={chMenu()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            ch={m().ch}
            isPinned={new Set(menuChannelPinned()).has(m().ch?.id)}
            developerMode={advancedDeveloperMode()}
            onClose={() => setChMenu(null)}
            onOpenInBrowser={openInBrowser}
            onPin={(ch) => pinChannel(ch?.id)}
            onUnpin={unpinChannel}
            onRaid={user() && m().ch?.id !== user()?.id
              ? raidChannel
              : undefined}
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
            placeholder="User name"
            onInput={setAddInput}
            onSubmit={submitAdd}
            onClose={closeAdd}
          />
        )}
      </Show>
    </div>
  );
}
