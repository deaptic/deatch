import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { ChevronRight, Eye, Plus, Search, Settings } from "lucide-solid";
import { openUrl } from "@tauri-apps/plugin-opener";
import { rememberUser } from "../../lib/stores/channels.ts";
import {
  advancedDeveloperMode,
  appearanceRailExpanded,
  pinChannel,
  pinnedChannels,
  reorderPinnedChannels,
  setAppearanceRailExpanded,
  unpinChannel,
} from "../../lib/stores/preferences.ts";
import { hasUnread } from "../../lib/stores/feeds.ts";
import { channelMentionCount } from "../../lib/stores/inbox.ts";
import {
  watchedChannel,
  watchMutedByLogin,
  watchWarmedChannels,
} from "../../lib/stores/watch.ts";
import { watchSetMuted } from "../../lib/api/watch.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import { errorMessage } from "../../lib/utils/error.ts";
import {
  activeView,
  isSettingsOpen,
  pendingChannel,
  selectedChannel,
  showExplore,
  toggleSettings,
  watchMode,
} from "../../lib/stores/view.ts";
import { getUsers } from "../../lib/api/twitch/users.ts";
import { beginRaid } from "../../lib/stores/raid.ts";
import { user } from "../../lib/stores/users.ts";
import { createScrollAffordance } from "../../lib/primitives/createScrollAffordance.ts";
import { createRailChannels } from "./createRailChannels.ts";
import RailRow from "./RailRow.tsx";
import RailTile from "./RailTile.tsx";
import RailDivider from "./RailDivider.tsx";
import ChannelRow from "./ChannelRow.tsx";
import Avatar from "../ui/Avatar.tsx";
import ScrollChevron from "./ScrollChevron.tsx";
import Skeleton from "../ui/Skeleton.tsx";
import InputPopover from "../ui/InputPopover.tsx";
import ChannelContextMenu from "../context-menus/ChannelContextMenu.tsx";
import { sessionManager } from "../../lib/managers/SessionManager.ts";
import type { User } from "../../lib/types/twitch/user.ts";

type Props = {
  onSelect: (ch: User) => void;
  onToggleWatch: () => void;
  onLiveChange?: (live: User[]) => void;
};

const WATCH_LABEL: Record<"auto" | "manual" | "off", string> = {
  auto: "Auto · following your browser",
  manual: "Manual · pick a tab",
  off: "Browser tabs",
};

function RowSkeleton() {
  const expanded = appearanceRailExpanded;
  return (
    <div class="h-14 flex items-center gap-3 px-4">
      <Skeleton shape="circle" class="size-10 shrink-0" />
      <Show when={expanded()}>
        <div class="flex-1 flex flex-col gap-1.5">
          <Skeleton shape="line" class="h-3.5 w-24" />
          <Skeleton shape="line" class="h-3 w-32" />
        </div>
      </Show>
    </div>
  );
}

export default function Rail(props: Props) {
  const expanded = appearanceRailExpanded;
  const channels = createRailChannels(props.onLiveChange);
  const main = createScrollAffordance();
  const watch = createScrollAffordance();

  const selectedId = () => {
    const v = activeView();
    return typeof v === "object" ? v.id : null;
  };

  const warmedIds = createMemo(
    () => new Set(watchWarmedChannels().map((c) => c?.id)),
  );

  const isListed = (id: string) =>
    new Set(pinnedChannels()).has(id) ||
    warmedIds().has(id) ||
    watchedChannel()?.id === id ||
    channels.isLive(id) ||
    id === user()?.id;

  const nowViewing = createMemo(() => {
    const sel = selectedChannel();
    return sel && !isListed(sel.id) ? sel : null;
  });

  const watchKey = () => watchMode() ?? "off";

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
    pinnedChannels();
    channels.onlineList().length;
    expanded();
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
      if (pinnedChannels().includes(u.id)) {
        addToast("Already pinned", "error");
        closeAdd();
        return;
      }
      channels.cachePinned(u);
      rememberUser(u);
      pinChannel(u.id);
      closeAdd();
    } catch (e) {
      addToast(errorMessage(e), "error");
    } finally {
      setAddLoading(false);
    }
  }

  function pin(ch: User) {
    channels.cachePinned(ch);
    rememberUser(ch);
    pinChannel(ch.id);
  }

  return (
    <nav
      aria-label="Channels"
      class={`flex flex-col h-full shrink-0 bg-surface border-r border-line-soft overflow-hidden transition-all duration-settle ease-out ${
        expanded() ? "w-rail-expanded" : "w-rail"
      }`}
    >
      <button
        type="button"
        aria-label={expanded() ? "Collapse rail" : "Expand rail"}
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
          Collapse
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
          <div class="flex flex-col py-1.5">
            <Show
              when={!channels.loadingPinned()}
              fallback={
                <For each={pinnedChannels()}>{() => <RowSkeleton />}</For>
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
            <RailRow
              ref={(el) => (addBtn = el)}
              label="Pin a channel"
              tooltip={
                <p class="font-semibold whitespace-nowrap">Pin a channel</p>
              }
              onClick={openAdd}
            >
              <RailTile>
                <Plus />
              </RailTile>
            </RailRow>
          </div>

          <RailDivider />

          <div class="flex flex-col py-1.5">
            <Show
              when={!channels.loadingLive()}
              fallback={
                <For each={Array.from({ length: 4 })}>
                  {() => <RowSkeleton />}
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
                      onOpenInBrowser={() => openInBrowser(ch)}
                      onContextMenu={(x, y) => setChMenu({ ch, x, y })}
                    />
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>

      <Show when={watchWarmedChannels().length > 0}>
        <RailDivider />
        <div class="flex flex-col py-1.5 shrink-0">
          <RailRow
            label="Watch"
            sub={WATCH_LABEL[watchKey()]}
            subTone={watchKey() === "auto"
              ? "positive"
              : watchKey() === "manual"
              ? "caution"
              : "soft"}
            tooltip={
              <p class="font-semibold whitespace-nowrap">
                Watch · {WATCH_LABEL[watchKey()]}
              </p>
            }
            onClick={props.onToggleWatch}
          >
            <RailTile
              active={watchKey() === "auto"
                ? "positive"
                : watchKey() === "manual"
                ? "caution"
                : false}
            >
              <Eye />
            </RailTile>
          </RailRow>
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
              class="flex max-h-44 flex-col overflow-y-auto scrollbar-none"
            >
              <For each={watchWarmedChannels()}>
                {(ch) => (
                  <div data-channel-id={ch?.id}>
                    <ChannelRow
                      ch={ch}
                      selected={selectedId() === ch?.id}
                      unread={hasUnread(ch?.id)}
                      mentions={channelMentionCount(ch?.id)}
                      muted={watchMutedByLogin()[ch?.login] === true}
                      onToggleMute={() =>
                        void watchSetMuted(
                          ch?.login,
                          watchMutedByLogin()[ch?.login] !== true,
                        )}
                      onSelect={() => props.onSelect(ch)}
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
            <RailDivider />
            <div class="py-1.5 shrink-0" data-channel-id={nv().id}>
              <ChannelRow
                ch={nv()}
                selected={selectedId() === nv().id}
                unread={hasUnread(nv().id)}
                mentions={channelMentionCount(nv().id)}
                ephemeral
                onSelect={() => props.onSelect(nv())}
                onOpenInBrowser={() => openInBrowser(nv())}
                onContextMenu={(x, y) => setChMenu({ ch: nv(), x, y })}
              />
            </div>
          </>
        )}
      </Show>

      <RailDivider />
      <div class="flex flex-col py-1.5 shrink-0">
        <RailRow
          label="Explore"
          sub="Find live channels"
          tooltip={<p class="font-semibold whitespace-nowrap">Explore</p>}
          selected={activeView() === "explore"}
          onClick={showExplore}
        >
          <RailTile active={activeView() === "explore" && "accent"}>
            <Search />
          </RailTile>
        </RailRow>
        <RailRow
          label="Settings"
          sub="Preferences and keys"
          tooltip={<p class="font-semibold whitespace-nowrap">Settings</p>}
          selected={isSettingsOpen()}
          onClick={toggleSettings}
        >
          <RailTile active={isSettingsOpen() && "accent"}>
            <Settings />
          </RailTile>
        </RailRow>
        <Show when={user()}>
          {(u) => (
            <RailRow
              label={u().displayName}
              sub="Your channel"
              tooltip={
                <p class="font-semibold whitespace-nowrap">
                  {u().displayName}
                </p>
              }
              selected={selectedId() === u().id}
              unread={hasUnread(u().id)}
              mentions={channelMentionCount(u().id)}
              onClick={() => props.onSelect(u())}
              onMiddleClick={() => openInBrowser(u())}
              onContextMenu={(x, y) => setChMenu({ ch: u(), x, y })}
            >
              <Avatar
                src={u().profileImageUrl}
                alt={u().displayName}
                size={40}
                presence="online"
              />
            </RailRow>
          )}
        </Show>
      </div>

      <Show when={chMenu()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            ch={m().ch}
            isPinned={new Set(pinnedChannels()).has(m().ch?.id)}
            developerMode={advancedDeveloperMode()}
            onClose={() => setChMenu(null)}
            onOpenInBrowser={openInBrowser}
            onPin={m().ch?.id === user()?.id ? undefined : pin}
            onUnpin={unpinChannel}
            onRaid={user() && m().ch?.id !== user()?.id
              ? raidChannel
              : undefined}
            onLogout={m().ch?.id === user()?.id
              ? () => sessionManager.logout()
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
            placeholder="Channel name"
            onInput={setAddInput}
            onSubmit={submitAdd}
            onClose={closeAdd}
          />
        )}
      </Show>
    </nav>
  );
}
