import { Search } from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import { createListbox } from "../../shared/solid/createListbox.ts";
import * as users from "../../lib/services/users.ts";
import { channelsInOrder, streamForUserId } from "../../lib/stores/channels.ts";
import { pinnedChannels } from "../../lib/stores/preferences.ts";
import * as pins from "../../lib/services/pins.ts";
import * as link from "../../features/link/index.ts";
import { user } from "../../lib/stores/users.ts";
import { addToast } from "../../kit/toasts.ts";
import { liveLine } from "../../shared/format/stream.ts";
import type { JSX } from "solid-js";
import type { User } from "../../lib/types/index.ts";
import {
  type QuickSwitchRow,
  quickSwitchRows,
  uniqueUsers,
} from "../../lib/utils/quickSwitch.ts";
import Avatar from "../../kit/Avatar.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import Field from "../../kit/Field.tsx";
import Loading from "../../kit/Loading.tsx";
import Modal from "../../kit/Modal.tsx";
import { autofocus } from "../../shared/solid/focus.ts";
import Kbd from "../../kit/Kbd.tsx";
import { Dynamic } from "solid-js/web";
import { type PaletteAction, paletteActions } from "./paletteActions.ts";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  onSelect: (ch: User) => void;
  onClose: () => void;
};

export default function QuickSwitch(props: Props) {
  const [query, setQuery] = createSignal("");
  const [searching, setSearching] = createSignal(false);

  const actions = createMemo(paletteActions);
  const rows = createMemo(() =>
    quickSwitchRows(
      uniqueUsers([...channelsInOrder(), ...link.tabs(), user()]),
      actions(),
      query(),
    ),
  );

  const listbox = createListbox({
    count: () => rows().length,
  });

  createEffect(on(query, () => listbox.setActive(0)));

  function choose(channel: User, pin: boolean) {
    if (pin && pins.add(channel) === "pinned") {
      addToast(
        t("QUICK_SWITCH_PINNED_TOAST", { name: channel.displayName }),
        "success",
      );
    }
    props.onSelect(channel);
    props.onClose();
  }

  async function open(row: QuickSwitchRow<PaletteAction>, pin: boolean) {
    if (row.kind === "channel") {
      choose(row.user, pin);
      return;
    }
    if (row.kind === "action") {
      props.onClose();
      row.action.run();
      return;
    }
    setSearching(true);
    const found = await users.lookUp(
      row.query,
      t("QUICK_SWITCH_NOT_FOUND_ERROR"),
    );
    setSearching(false);
    if (found) choose(found, pin);
  }

  onMount(() => {
    const unbind = shortcuts.bindScope("quickSwitchOpen", {
      up: () => listbox.move(-1),
      down: () => listbox.move(1),
      enter: () => {
        const row = rows()[listbox.active()];
        if (row) void open(row, false);
      },
    });
    const unbindPin = shortcuts.register(
      "quickSwitch::openPinned",
      () => {
        const row = rows()[listbox.active()];
        if (row) void open(row, true);
      },
      "quickSwitchOpen",
    );
    onCleanup(() => {
      unbind();
      unbindPin();
    });
  });

  return (
    <Modal
      look="palette"
      label={t("QUICK_SWITCH_LABEL")}
      onClose={props.onClose}
    >
      <Field
        size="lg"
        {...listbox.field}
        icon={<Search />}
        ref={autofocus}
        placeholder={t("QUICK_SWITCH_PLACEHOLDER")}
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
        trailing={<Kbd size="sm" combo="escape" />}
      />
      <div
        {...listbox.list}
        class="flex-1 min-h-0 overflow-y-auto mt-2 flex flex-col gap-0.5"
      >
        <Show
          when={rows().length > 0}
          fallback={
            <p class="py-8 text-center text-body text-ink-soft">
              {t("QUICK_SWITCH_EMPTY")}
            </p>
          }
        >
          <For each={rows()}>
            {(row, i) => {
              const channelLink = createChannelLink(() =>
                row.kind === "channel" ? row.user : undefined,
              );
              return (
                <button
                  type="button"
                  {...listbox.option(i)}
                  onMouseMove={() => listbox.setActive(i())}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => void open(row, e.ctrlKey)}
                  onContextMenu={channelLink.handlers.onContextMenu}
                  onAuxClick={channelLink.handlers.onAuxClick}
                  class={`flex items-center gap-3 h-13 px-2.5 rounded-sm text-left cursor-pointer transition-colors duration-snap ${
                    listbox.active() === i() ? "bg-raised" : "hover:bg-raised"
                  }`}
                >
                  <Show when={row.kind === "action" ? row.action : null}>
                    {(action) => (
                      <>
                        <RowIcon>
                          <Dynamic component={action().icon} class="size-4" />
                        </RowIcon>
                        <span class="flex-1 min-w-0 text-body font-semibold text-ink truncate">
                          {action().label}
                        </span>
                      </>
                    )}
                  </Show>
                  <Show when={row.kind === "search"}>
                    <>
                      <RowIcon>
                        <Show
                          when={!searching()}
                          fallback={<Loading size={16} />}
                        >
                          <Search class="size-4" />
                        </Show>
                      </RowIcon>
                      <span class="flex-1 min-w-0 flex flex-col">
                        <span class="text-body font-semibold text-ink truncate">
                          {t("QUICK_SWITCH_SEARCH_TWITCH_LABEL", {
                            query: query().trim(),
                          })}
                        </span>
                        <span class="text-small text-ink-soft">
                          {t("QUICK_SWITCH_NOT_IN_RAIL_LABEL")}
                        </span>
                      </span>
                    </>
                  </Show>
                  <Show when={row.kind === "channel" ? row : null}>
                    {(r) => {
                      const stream = () => streamForUserId(r().user.id);
                      return (
                        <>
                          <Avatar
                            src={r().user.profileImageUrl}
                            alt={r().user.displayName}
                            size={32}
                            presence={stream() ? "live" : "offline"}
                          />
                          <span class="flex-1 min-w-0 flex flex-col">
                            <span class="text-body font-semibold text-ink truncate">
                              {r().user.displayName}
                            </span>
                            <span
                              class={`text-small truncate ${
                                stream() ? "text-live" : "text-ink-soft"
                              }`}
                            >
                              <Show
                                when={stream()}
                                fallback={t("QUICK_SWITCH_OFFLINE_STATUS")}
                              >
                                {(s) =>
                                  liveLine(s().game.name, s().viewerCount)
                                }
                              </Show>
                              <Show
                                when={pinnedChannels().includes(r().user.id)}
                              >
                                {` · ${t("QUICK_SWITCH_PINNED_LABEL")}`}
                              </Show>
                            </span>
                          </span>
                        </>
                      );
                    }}
                  </Show>
                  <Show when={listbox.active() === i()}>
                    <Kbd size="sm" combo="enter" />
                  </Show>
                  {channelLink.menu()}
                </button>
              );
            }}
          </For>
        </Show>
      </div>
      <div class="flex items-center gap-4 pt-2.5 mt-2 px-1 text-small text-ink-faint">
        <span class="flex items-center gap-1.5">
          <Kbd size="sm" combo="up" />
          <Kbd size="sm" combo="down" /> {t("QUICK_SWITCH_MOVE_HINT")}
        </span>
        <span class="flex items-center gap-1.5">
          <Kbd size="sm" combo="enter" /> {t("QUICK_SWITCH_OPEN_HINT")}
        </span>
        <span class="flex items-center gap-1.5">
          <Kbd size="sm" combo="ctrl-enter" /> {t("QUICK_SWITCH_OPEN_PIN_HINT")}
        </span>
      </div>
    </Modal>
  );
}

function RowIcon(props: { children: JSX.Element }) {
  return (
    <span class="size-8 shrink-0 rounded-full bg-raised grid place-items-center text-ink-soft">
      {props.children}
    </span>
  );
}
