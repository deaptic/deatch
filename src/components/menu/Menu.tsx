import { Show, createEffect, createSignal } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  selectedChannel,
  rememberUser,
} from "../../lib/stores/channels";
import {
  advancedDeveloperMode,
  menuChannelPinned,
  pinChannel,
  unpinChannel,
} from "../../lib/stores/preferences";
import { addToast } from "../../lib/stores/toasts";
import { getUsers } from "../../lib/api/twitch/users";
import { createScrollAffordance } from "../../lib/primitives/createScrollAffordance";
import { createMenuChannels } from "./createMenuChannels";
import MenuSection from "./MenuSection";
import MenuAddButton from "./MenuAddButton";
import MenuPinnedList from "./MenuPinnedList";
import MenuLiveList from "./MenuLiveList";
import MenuWatchedList from "./MenuWatchedList";
import MenuWatchToggle from "./MenuWatchToggle";
import ChevronUpIcon from "../icons/ChevronUpIcon";
import ChevronDownIcon from "../icons/ChevronDownIcon";
import InputPopover from "../ui/InputPopover";
import ChannelContextMenu from "../context-menus/ChannelContextMenu";
import type { User } from "../../lib/types/twitch/user";

type Props = {
  onSelect: (ch: User, fromWatched?: boolean) => void;
  selectedId: string | null;
  onLiveChange?: (live: User[]) => void;
};

export default function Menu(props: Props) {
  const channels = createMenuChannels(props.onLiveChange);
  const main = createScrollAffordance();

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
  let addBtn: HTMLButtonElement | undefined;

  createEffect(() => {
    menuChannelPinned();
    channels.onlineList().length;
    queueMicrotask(main.update);
  });

  createEffect(() => {
    const sel = selectedChannel();
    if (!sel) return;
    queueMicrotask(() => {
      const targets = document.querySelectorAll(`[data-channel-id="${sel.id}"]`);
      for (const t of targets) {
        (t as HTMLElement).scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  });

  function openInBrowser(ch: User) {
    openUrl(`https://twitch.tv/${ch?.login}`);
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
    <div class="flex flex-col h-full w-14 shrink-0 bg-bg-dark border-r border-border-muted overflow-hidden">
      <div class="relative flex-1 min-h-0">
        <Show when={main.canUp()}>
          <button
            type="button"
            onClick={() => main.scrollByOne(-1)}
            class="absolute top-0 left-0 right-0 h-5 flex items-center justify-center bg-gradient-to-b from-bg-dark to-transparent z-10 text-text-muted hover:text-text cursor-pointer"
          >
            <ChevronUpIcon class="w-3 h-3" />
          </button>
        </Show>
        <Show when={main.canDown()}>
          <button
            type="button"
            onClick={() => main.scrollByOne(1)}
            class="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center bg-gradient-to-t from-bg-dark to-transparent z-10 text-text-muted hover:text-text cursor-pointer"
          >
            <ChevronDownIcon class="w-3 h-3" />
          </button>
        </Show>
        <div
          ref={main.setRef}
          onScroll={main.update}
          class="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <MenuSection divider="bottom">
            <MenuPinnedList
              resolveChannel={channels.resolveChannel}
              isLive={channels.isLive}
              loading={channels.loadingPinned()}
              selectedId={props.selectedId}
              onSelect={(ch) => props.onSelect(ch)}
              onOpenInBrowser={openInBrowser}
              onContextMenu={(ch, x, y) => setChMenu({ ch, x, y })}
            />
            <MenuAddButton ref={(el) => (addBtn = el)} onClick={openAdd} />
          </MenuSection>

          <MenuSection>
            <MenuLiveList
              channels={channels.onlineList()}
              loading={channels.loadingLive()}
              selectedId={props.selectedId}
              onSelect={(ch) => props.onSelect(ch)}
              onOpenInBrowser={openInBrowser}
              onContextMenu={(ch, x, y) => setChMenu({ ch, x, y })}
            />
          </MenuSection>
        </div>
      </div>

      <MenuWatchedList
        selectedId={props.selectedId}
        isLive={channels.isLive}
        onSelect={props.onSelect}
        onOpenInBrowser={openInBrowser}
        onContextMenu={(ch, x, y) => setChMenu({ ch, x, y })}
      />

      <MenuWatchToggle />

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
