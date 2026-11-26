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
import { knownUser, users } from "../users/index.ts";
import EmptyState from "../../kit/EmptyState.tsx";
import OptionRow from "../../kit/OptionRow.tsx";
import PaletteList from "../../kit/PaletteList.tsx";
import Text from "../../kit/Text.tsx";

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

  users.ensure(() => results().map((hit) => hit.broadcasterId));

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
    <Modal variant="palette" label={t("SEARCH_LABEL")} onClose={props.onClose}>
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
      <PaletteList {...listbox.list}>
        <Switch>
          <Match when={!settled()}>
            <EmptyState variant="palette" body={t("SEARCH_HINT")} />
          </Match>
          <Match when={results.loading && results().length === 0}>
            <Loading block />
          </Match>
          <Match when={results().length === 0}>
            <EmptyState
              variant="palette"
              body={t("SEARCH_EMPTY", { query: settled() })}
            />
          </Match>
          <Match when={results().length > 0}>
            <For each={results()}>
              {(hit, i) => (
                <OptionRow
                  {...listbox.option(i)}
                  onMouseMove={() => listbox.setActive(i())}
                  onClick={() => open(i())}
                  size="stack"
                  active={listbox.active() === i()}
                >
                  <span class="flex items-baseline gap-2 min-w-0">
                    <Text size="md" bold tone="primary" class="shrink-0">
                      {hit.message.chatter_name}
                    </Text>
                    <Text truncate size="md" tone="soft" class="min-w-0">
                      {textOf(hit.message)}
                    </Text>
                  </span>
                  <Text size="sm" tone="faint">
                    {t("SEARCH_RESULT_META_VALUE", {
                      channel:
                        knownUser(hit.broadcasterId)?.displayName ??
                        hit.broadcasterId,
                      time: new Time(hit.message.timestamp, "c").toString(),
                    })}
                  </Text>
                </OptionRow>
              )}
            </For>
          </Match>
        </Switch>
      </PaletteList>
    </Modal>
  );
}
