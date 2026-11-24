import { Search } from "lucide-solid";
import {
  createEffect,
  createResource,
  createSignal,
  For,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import { createListbox } from "../../shared/solid/createListbox.ts";
import { autofocus } from "../../shared/solid/focus.ts";
import { Time } from "../../shared/time.ts";
import Field from "../../kit/Field.tsx";
import Kbd from "../../kit/Kbd.tsx";
import Loading from "../../kit/Loading.tsx";
import Modal from "../../kit/Modal.tsx";
import Segmented from "../../kit/Segmented.tsx";
import { feedLog, textOf } from "../feed/index.ts";
import { selectedChannel } from "../navigation/index.ts";
import { knownUser } from "../users/index.ts";

const LIMIT = 100;
const TYPING_PAUSE_MS = 200;

type Scope = "channel" | "all";

type Props = {
  onJump: (broadcasterId: string, messageId: string) => void;
  onClose: () => void;
};

export default function SearchPalette(props: Props) {
  const [query, setQuery] = createSignal("");
  const [settled, setSettled] = createSignal("");
  const [scope, setScope] = createSignal<Scope>(
    selectedChannel() ? "channel" : "all",
  );
  const channelId = () =>
    scope() === "channel" ? (selectedChannel()?.id ?? null) : null;

  createEffect(
    on(query, (q) => {
      const timer = setTimeout(() => setSettled(q.trim()), TYPING_PAUSE_MS);
      onCleanup(() => clearTimeout(timer));
    }),
  );

  const [results] = createResource(
    () => ({ q: settled(), channel: channelId() }),
    ({ q, channel }) =>
      q ? feedLog.search(q, channel, LIMIT).catch(() => []) : [],
    { initialValue: [] },
  );

  const listbox = createListbox({ count: () => results().length });
  createEffect(on(results, () => listbox.setActive(0)));

  function open(index: number) {
    const hit = results()[index];
    if (!hit) return;
    props.onClose();
    props.onJump(hit.broadcasterId, hit.message.message_id);
  }

  onMount(() => {
    const unbind = shortcuts.bindScope("searchOpen", {
      up: () => listbox.move(-1),
      down: () => listbox.move(1),
      enter: () => open(listbox.active()),
      tab: () => {
        if (selectedChannel())
          setScope(scope() === "channel" ? "all" : "channel");
      },
    });
    onCleanup(unbind);
  });

  return (
    <Modal look="palette" label={t("SEARCH_LABEL")} onClose={props.onClose}>
      <div class="shrink-0 flex flex-col gap-2">
        <Field
          size="lg"
          {...listbox.field}
          icon={<Search />}
          ref={autofocus}
          placeholder={t("SEARCH_PLACEHOLDER")}
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          trailing={<Kbd size="sm" combo="escape" />}
        />
        <Show when={selectedChannel()}>
          {(channel) => (
            <div class="flex items-center gap-2">
              <Segmented
                label={t("SEARCH_SCOPE_LABEL")}
                value={scope()}
                options={[
                  {
                    value: "channel",
                    label: t("SEARCH_SCOPE_CHANNEL_LABEL", {
                      name: channel().displayName,
                    }),
                  },
                  { value: "all", label: t("SEARCH_SCOPE_ALL_LABEL") },
                ]}
                onChange={setScope}
              />
              <Kbd size="sm" combo="tab" />
            </div>
          )}
        </Show>
      </div>
      <div
        {...listbox.list}
        class="flex-1 min-h-0 overflow-y-auto mt-2 flex flex-col gap-0.5"
      >
        <Switch>
          <Match when={!settled()}>
            <p class="py-8 text-center text-body text-ink-soft">
              {t("SEARCH_HINT")}
            </p>
          </Match>
          <Match when={results.loading && results().length === 0}>
            <div class="py-8 grid place-items-center">
              <Loading />
            </div>
          </Match>
          <Match when={results().length === 0}>
            <p class="py-8 text-center text-body text-ink-soft">
              {t("SEARCH_EMPTY", { query: settled() })}
            </p>
          </Match>
          <Match when={results().length > 0}>
            <For each={results()}>
              {(hit, i) => (
                <button
                  type="button"
                  {...listbox.option(i)}
                  onMouseMove={() => listbox.setActive(i())}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => open(i())}
                  class={`flex shrink-0 flex-col gap-0.5 px-2.5 py-2 rounded-sm text-left cursor-pointer transition-colors duration-snap ${
                    listbox.active() === i() ? "bg-raised" : "hover:bg-raised"
                  }`}
                >
                  <span class="flex items-baseline gap-2 min-w-0">
                    <span class="shrink-0 text-body font-semibold text-ink">
                      {hit.message.chatter_name}
                    </span>
                    <span class="min-w-0 truncate text-body text-ink-soft">
                      {textOf(hit.message)}
                    </span>
                  </span>
                  <span class="text-small text-ink-faint">
                    {t("SEARCH_RESULT_META_VALUE", {
                      channel:
                        knownUser(hit.broadcasterId)?.displayName ??
                        hit.broadcasterId,
                      time: new Time(hit.message.timestamp, "c").toString(),
                    })}
                  </span>
                </button>
              )}
            </For>
          </Match>
        </Switch>
      </div>
    </Modal>
  );
}
