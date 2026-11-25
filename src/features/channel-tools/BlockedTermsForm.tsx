import { X } from "lucide-solid";
import { createSignal, For, onMount, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import {
  addBlockedTerm,
  getBlockedTerms,
  removeBlockedTerm,
} from "../../platform/twitch/moderation.ts";
import { autofocus } from "../../shared/solid/focus.ts";
import type { BlockedTerm } from "../../shared/types/index.ts";
import Button from "../../kit/Button.tsx";
import Dialog from "../../kit/Dialog.tsx";
import Field from "../../kit/Field.tsx";
import IconButton from "../../kit/IconButton.tsx";
import Loading from "../../kit/Loading.tsx";
import EmptyState from "../../kit/EmptyState.tsx";
import ListRow from "../../kit/ListRow.tsx";
import Text from "../../kit/Text.tsx";

const MIN_TERM_LENGTH = 2;

type Props = {
  broadcasterId: string;
  onDone: () => void;
};

export default function BlockedTermsForm(props: Props) {
  const [terms, setTerms] = createSignal<BlockedTerm[] | null>(null);
  const [text, setText] = createSignal("");
  const [adding, setAdding] = createSignal(false);
  const canAdd = () => text().trim().length >= MIN_TERM_LENGTH && !adding();

  onMount(() =>
    getBlockedTerms({ broadcasterId: props.broadcasterId })
      .then((list) =>
        setTerms(list.toSorted((a, b) => a.text.localeCompare(b.text))),
      )
      .catch(() => setTerms([])),
  );

  function add() {
    if (!canAdd()) return;
    setAdding(true);
    addBlockedTerm({ broadcasterId: props.broadcasterId, text: text() })
      .then((term) => {
        if (term) setTerms((list) => [term, ...(list ?? [])]);
        setText("");
      })
      .catch(() => {})
      .finally(() => setAdding(false));
  }

  function remove(term: BlockedTerm) {
    removeBlockedTerm({ broadcasterId: props.broadcasterId, termId: term.id })
      .then(() =>
        setTerms((list) => (list ?? []).filter((x) => x.id !== term.id)),
      )
      .catch(() => {});
  }

  return (
    <Dialog
      title={t("BLOCKED_TERMS_TITLE")}
      description={t("BLOCKED_TERMS_DESCRIPTION")}
      onClose={props.onDone}
      onSubmit={add}
      actions={
        <Button variant="neutral" onClick={() => props.onDone()}>
          {t("BLOCKED_TERMS_CLOSE_LABEL")}
        </Button>
      }
    >
      <div class="flex gap-2">
        <Field
          ref={autofocus}
          class="flex-1 min-w-0"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          placeholder={t("BLOCKED_TERMS_PLACEHOLDER")}
          aria-label={t("BLOCKED_TERMS_PLACEHOLDER")}
          maxLength={500}
        />
        <Button type="submit" disabled={!canAdd()} loading={adding()}>
          {t("BLOCKED_TERMS_ADD_LABEL")}
        </Button>
      </div>
      <div class="h-72 overflow-y-auto -mx-2 px-2">
        <Show when={terms()} fallback={<Loading block />}>
          {(list) => (
            <Show
              when={list().length}
              fallback={
                <EmptyState variant="list" body={t("BLOCKED_TERMS_EMPTY")} />
              }
            >
              <For each={list()}>
                {(term) => (
                  <ListRow
                    actions={
                      <IconButton
                        label={t("BLOCKED_TERMS_REMOVE_LABEL", {
                          term: term.text,
                        })}
                        size="sm"
                        onClick={() => remove(term)}
                      >
                        <X class="size-4" />
                      </IconButton>
                    }
                  >
                    <Text
                      truncate
                      size="md"
                      tone="primary"
                      class="flex-1 min-w-0"
                    >
                      {term.text}
                    </Text>
                  </ListRow>
                )}
              </For>
            </Show>
          )}
        </Show>
      </div>
    </Dialog>
  );
}
