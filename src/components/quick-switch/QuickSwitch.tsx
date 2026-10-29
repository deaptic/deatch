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
import * as shortcuts from "../../lib/services/shortcuts.ts";
import { createListbox } from "../../lib/reactive/createListbox.ts";
import * as users from "../../lib/services/users.ts";
import { channelsInOrder, streamForUserId } from "../../lib/stores/channels.ts";
import { pinnedChannels } from "../../lib/stores/preferences.ts";
import * as pins from "../../lib/services/pins.ts";
import { linkWarmedChannels } from "../../lib/stores/link.ts";
import { user } from "../../lib/stores/users.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import { liveLine } from "../../lib/format/stream.ts";
import type { User } from "../../lib/types/index.ts";
import {
  type QuickSwitchRow,
  quickSwitchRows,
  uniqueUsers,
} from "../../lib/utils/quickSwitch.ts";
import Avatar from "../ui/Avatar.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import Field from "../ui/Field.tsx";
import Loading from "../ui/Loading.tsx";
import Modal from "../ui/Modal.tsx";
import { autofocus } from "../../lib/reactive/focus.ts";
import Kbd from "../ui/Kbd.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  onSelect: (ch: User) => void;
  onClose: () => void;
};

export default function QuickSwitch(props: Props) {
  const [query, setQuery] = createSignal("");
  const [searching, setSearching] = createSignal(false);

  const rows = createMemo(() =>
    quickSwitchRows(
      uniqueUsers([...channelsInOrder(), ...linkWarmedChannels(), user()]),
      query(),
    ),
  );

  const listbox = createListbox({
    count: () => rows().length,
  });

  // Only typing resets the highlight; the live poll must not move it.
  createEffect(on(query, () => listbox.setActive(0)));

  function choose(channel: User, pin: boolean) {
    if (pin && pins.add(channel) === "pinned") {
      addToast(
        t("QUICK_SWITCH_PINNED", { name: channel.displayName }),
        "success",
      );
    }
    props.onSelect(channel);
    props.onClose();
  }

  async function open(row: QuickSwitchRow, pin: boolean) {
    if (row.kind === "channel") {
      choose(row.user, pin);
      return;
    }
    setSearching(true);
    const found = await users.lookUp(row.query, t("QUICK_SWITCH_NOT_FOUND"));
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
              const link = createChannelLink(() =>
                row.kind === "channel" ? row.user : undefined,
              );
              return (
                <button
                  type="button"
                  {...listbox.option(i)}
                  onMouseMove={() => listbox.setActive(i())}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => void open(row, e.ctrlKey)}
                  onContextMenu={link.handlers.onContextMenu}
                  onAuxClick={link.handlers.onAuxClick}
                  class={`flex items-center gap-3 h-13 px-2.5 rounded-sm text-left cursor-pointer transition-colors duration-snap ${
                    listbox.active() === i() ? "bg-raised" : "hover:bg-raised"
                  }`}
                >
                  <Show
                    when={row.kind === "channel" ? row : null}
                    fallback={
                      <>
                        <span class="size-8 rounded-full bg-raised grid place-items-center text-ink-soft">
                          <Show
                            when={!searching()}
                            fallback={<Loading size={16} />}
                          >
                            <Search class="size-4" />
                          </Show>
                        </span>
                        <span class="flex-1 min-w-0 flex flex-col">
                          <span class="text-body font-semibold text-ink truncate">
                            {t("QUICK_SWITCH_SEARCH_TWITCH", {
                              query: query().trim(),
                            })}
                          </span>
                          <span class="text-small text-ink-soft">
                            {t("QUICK_SWITCH_NOT_IN_RAIL")}
                          </span>
                        </span>
                      </>
                    }
                  >
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
                                fallback={t("QUICK_SWITCH_OFFLINE")}
                              >
                                {(s) =>
                                  liveLine(s().game.name, s().viewerCount)
                                }
                              </Show>
                              <Show
                                when={pinnedChannels().includes(r().user.id)}
                              >
                                {` · ${t("QUICK_SWITCH_PINNED_TAG")}`}
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
                  {link.menu()}
                </button>
              );
            }}
          </For>
        </Show>
      </div>
      <div class="flex items-center gap-4 pt-2.5 mt-2 px-1 border-t border-line-soft text-small text-ink-faint">
        <span class="flex items-center gap-1.5">
          <Kbd size="sm" combo="up" />
          <Kbd size="sm" combo="down" /> {t("QUICK_SWITCH_MOVE")}
        </span>
        <span class="flex items-center gap-1.5">
          <Kbd size="sm" combo="enter" /> {t("QUICK_SWITCH_OPEN")}
        </span>
        <span class="flex items-center gap-1.5">
          <Kbd size="sm" combo="ctrl-enter" /> {t("QUICK_SWITCH_OPEN_PIN")}
        </span>
      </div>
    </Modal>
  );
}
