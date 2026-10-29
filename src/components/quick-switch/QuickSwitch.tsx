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
import { createListNavigation } from "../../lib/reactive/createListNavigation.ts";
import * as users from "../../lib/services/users.ts";
import { channelsInOrder, streamForUserId } from "../../lib/stores/channels.ts";
import { pinnedChannels } from "../../lib/stores/preferences.ts";
import * as pins from "../../lib/services/pins.ts";
import { linkWarmedChannels } from "../../lib/stores/link.ts";
import { user } from "../../lib/stores/users.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import { liveLine } from "../../lib/format/stream.ts";
import type { User } from "../../lib/types/index.ts";
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

type Row = { kind: "channel"; user: User } | { kind: "search"; query: string };

function candidates(): User[] {
  const seen = new Set<string>();
  const out: User[] = [];
  const push = (u: User | null | undefined) => {
    if (!u || seen.has(u.id)) return;
    seen.add(u.id);
    out.push(u);
  };
  for (const u of channelsInOrder()) push(u);
  for (const u of linkWarmedChannels()) push(u);
  push(user());
  return out;
}

function matches(u: User, q: string): boolean {
  return u.login.includes(q) || u.displayName.toLowerCase().includes(q);
}

export default function QuickSwitch(props: Props) {
  const [query, setQuery] = createSignal("");
  const [searching, setSearching] = createSignal(false);

  const rows = createMemo<Row[]>(() => {
    const q = query().trim().toLowerCase();
    const list = candidates().filter((u) => !q || matches(u, q));
    const out: Row[] = list.map((user) => ({ kind: "channel", user }));
    if (q && !list.some((u) => u.login === q)) {
      out.push({ kind: "search", query: q });
    }
    return out;
  });

  const { active, setActive, move } = createListNavigation({
    count: () => rows().length,
    rowAt: (i) => document.querySelector(`[data-switch-index="${i}"]`),
  });

  // Only typing resets the highlight; the live poll must not move it.
  createEffect(on(query, () => setActive(0)));

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

  async function open(row: Row, pin: boolean) {
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
      up: () => move(-1),
      down: () => move(1),
      enter: () => {
        const row = rows()[active()];
        if (row) void open(row, false);
      },
    });
    const unbindPin = shortcuts.register(
      "quickSwitch::openPinned",
      () => {
        const row = rows()[active()];
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
        icon={<Search />}
        ref={autofocus}
        placeholder={t("QUICK_SWITCH_PLACEHOLDER")}
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
        trailing={<Kbd size="sm" combo="escape" />}
      />
      <div class="flex-1 min-h-0 overflow-y-auto mt-2 flex flex-col gap-0.5">
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
                  data-switch-index={i()}
                  onMouseMove={() => setActive(i())}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => void open(row, e.ctrlKey)}
                  onContextMenu={link.handlers.onContextMenu}
                  onAuxClick={link.handlers.onAuxClick}
                  class={`flex items-center gap-3 h-13 px-2.5 rounded-sm text-left cursor-pointer transition-colors duration-snap ${
                    active() === i() ? "bg-raised" : "hover:bg-raised"
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
                  <Show when={active() === i()}>
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
