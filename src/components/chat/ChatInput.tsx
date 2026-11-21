import { Smile, X } from "lucide-solid";
import { t, tRich } from "../../lib/i18n/index.ts";
import {
  createEffect,
  createSignal,
  lazy,
  on,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import { POPOVER_TOGGLE } from "../../lib/reactive/dismissOnOutside.ts";
import { fieldFrom } from "../../lib/reactive/createListbox.ts";
import * as chat from "../../lib/services/chat.ts";
import type { Command } from "../command-composer/types.ts";
import type { FeedMessage as Message } from "../../lib/types/index.ts";
import CommandComposer from "../command-composer/CommandComposer.tsx";
import * as emotes from "../../lib/services/emotes.ts";
import {
  pushSentMessage,
  sentMessages,
} from "../../lib/stores/sentMessages.ts";
import { getDraft, setDraft } from "../../lib/stores/drafts.ts";
import {
  closeOverlay,
  isOverlayOpen,
  toggleOverlay,
} from "../../lib/stores/ui.ts";
import ComposerField, { type ComposerFieldApi } from "./ComposerField.tsx";
import CharCounter from "./CharCounter.tsx";
import IconButton from "../ui/IconButton.tsx";
import ComposerCaption from "../ui/ComposerCaption.tsx";
const EmotePicker = lazy(() => import("../emotes/EmotePicker.tsx"));
import ChatAutocomplete, {
  type ChatAutocompleteHandle,
} from "./autocomplete/ChatAutocomplete.tsx";
import { createInputHistory } from "./createInputHistory.ts";
import { createUsernameTabComplete } from "./createUsernameTabComplete.ts";
import ComposerActions from "./ComposerActions.tsx";
import ComposerSlot from "../ui/ComposerSlot.tsx";
import { commands } from "../command-composer/commands.ts";

const MAX_LEN = 500;
const SEND_ACTION = "chat::send";

export type ReplyTo = { messageId: string; name: string; text: string };

export type ChatInputApi = {
  focus: () => void;
  insert: (text: string) => void;
  replace: (text: string) => void;
};

type Props = {
  broadcasterId: string;
  broadcasterName: string;
  replyTo: () => ReplyTo | null;
  onClearReply: () => void;
  getMentions: () => Message[];
  onReplyMention: (msg: Message) => void;
  openUserCard: (userId: string) => void;
  ref?: (api: ChatInputApi) => void;
};

export default function ChatInput(props: Props) {
  const [input, setInput] = createSignal(getDraft(props.broadcasterId));
  onCleanup(() => setDraft(props.broadcasterId, input()));
  const [sending, setSending] = createSignal(false);
  const [commandMode, setCommandMode] = createSignal<Command | null>(null);
  const [autocomplete, setAutocomplete] =
    createSignal<ChatAutocompleteHandle | null>(null);
  const suggestionsField = fieldFrom(() => autocomplete()?.field);
  const [mentionIdx, setMentionIdx] = createSignal(0);
  let textAreaApi: ComposerFieldApi | undefined;

  const focus = () => textAreaApi?.focus();
  const getCursor = () =>
    textAreaApi?.textareaEl()?.selectionStart ?? input().length;
  const setCursor = (pos: number) =>
    textAreaApi?.textareaEl()?.setSelectionRange(pos, pos);
  const setFocused = (b: boolean) => shortcuts.setContext("chat:focused", b);

  const history = createInputHistory({
    history: () => sentMessages(props.broadcasterId) ?? [],
    value: input,
    setValue: setInput,
    setCursor,
  });

  const tabComplete = createUsernameTabComplete({
    value: input,
    setValue: setInput,
    getCursor,
    setCursor,
    broadcasterId: () => props.broadcasterId,
  });

  const outgoing = () =>
    input()
      .replace(/\s*\n\s*/g, " ")
      .trim();
  const tooLong = () => outgoing().length > MAX_LEN;

  async function sendMessage() {
    const text = outgoing();
    if (!text || tooLong() || sending()) return;
    setSending(true);
    try {
      const reply = props.replyTo();
      const outcome = await chat.send({
        broadcasterId: props.broadcasterId,
        message: text,
        replyParentMessageId: reply?.messageId ?? null,
      });
      if (outcome !== "failed") {
        pushSentMessage(props.broadcasterId, text);
        history.reset();
        setMentionIdx(0);
        setInput("");
        props.onClearReply();
      }
    } finally {
      setSending(false);
    }
  }

  async function runCommand(values: Record<string, unknown>) {
    const cmd = commandMode();
    if (!cmd) return;
    setCommandMode(null);
    setInput("");
    await cmd
      .execute(values, {
        broadcasterId: props.broadcasterId,
        openUserCard: props.openUserCard,
      })
      .catch(() => {});
    queueMicrotask(focus);
  }

  function cancelCommand() {
    setCommandMode(null);
    setInput("");
    queueMicrotask(focus);
  }

  function startCommand(name: string) {
    const command = commands.find((c) => c.name === name);
    if (command) setCommandMode(command);
  }

  function openCommandList() {
    onInputChange(`/${input()}`);
    queueMicrotask(() => {
      focus();
      setCursor(1);
    });
  }

  function onInputChange(value: string) {
    tabComplete.reset();
    history.reset();
    setMentionIdx(0);
    setInput(value);
    autocomplete()?.update(value, getCursor());
  }

  function onKeyDown(e: KeyboardEvent) {
    autocomplete()?.handleKey(e);
  }

  function onEmoteSelect(value: string, opts?: { keepOpen?: boolean }) {
    textAreaApi?.insert(value);
    if (!opts?.keepOpen) closeOverlay();
  }

  function hasNewlineBeforeCursor() {
    const el = textAreaApi?.textareaEl();
    return input()
      .slice(0, el?.selectionStart ?? 0)
      .includes("\n");
  }

  function hasNewlineAfterCursor() {
    const el = textAreaApi?.textareaEl();
    return input()
      .slice(el?.selectionEnd ?? 0)
      .includes("\n");
  }

  function bindShortcuts() {
    const WHEN = "chat:focused && !chat:popupOpen";
    return [
      shortcuts.register(
        SEND_ACTION,
        () => {
          void sendMessage();
        },
        WHEN,
      ),
      shortcuts.register(
        "chat::tabComplete",
        () => {
          if (input().trim() === "") {
            const mentions = props.getMentions();
            const idx = Math.min(mentionIdx(), mentions.length - 1);
            const mention = mentions[idx];
            if (!mention) return;
            props.onReplyMention(mention);
            setMentionIdx(idx + 1);
            return;
          }
          tabComplete.complete();
        },
        WHEN,
      ),
      shortcuts.register(
        "chat::recallPrev",
        () => {
          if (hasNewlineBeforeCursor()) return shortcuts.PASS;
          return shortcuts.passUnless(history.step(1));
        },
        WHEN,
      ),
      shortcuts.register(
        "chat::recallNext",
        () => {
          if (hasNewlineAfterCursor()) return shortcuts.PASS;
          return shortcuts.passUnless(history.step(-1));
        },
        WHEN,
      ),
      shortcuts.registerLocal(
        "escape",
        () => {
          props.onClearReply();
        },
        "chat:replyActive",
      ),
    ];
  }

  createEffect(() => {
    shortcuts.setContext(
      "chat:popupOpen",
      (autocomplete()?.isActive() ?? false) || commandMode() !== null,
    );
  });

  createEffect(
    on(
      () => props.replyTo(),
      (reply) => {
        if (reply === null) setMentionIdx(0);
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    shortcuts.setContext("chat:replyActive", props.replyTo() !== null);
    onCleanup(() => shortcuts.setContext("chat:replyActive", false));
  });

  onMount(() => {
    void emotes.ensureUserLoaded();
  });

  onMount(() => {
    const unbind = bindShortcuts();
    onCleanup(() => {
      for (const u of unbind) u();
    });
  });

  return (
    <div class="p-2">
      <Show when={props.replyTo()}>
        {(reply) => (
          <ComposerCaption>
            <span class="shrink-0">
              {tRich("CHAT_INPUT_REPLYING_TO", {
                user: reply().name,
                name: (chunks) => (
                  <span class="font-semibold text-ink">{chunks}</span>
                ),
              })}
            </span>
            <span class="flex-1 min-w-0 truncate">{reply().text}</span>
            <IconButton
              label={t("CHAT_INPUT_CANCEL_REPLY")}
              size="sm"
              onClick={props.onClearReply}
            >
              <X class="size-4" />
            </IconButton>
          </ComposerCaption>
        )}
      </Show>
      <Show
        when={commandMode()}
        fallback={
          <ComposerField
            {...suggestionsField}
            value={input()}
            onInput={onInputChange}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={MAX_LEN}
            placeholder={t("CHAT_INPUT_PLACEHOLDER", {
              channel: props.broadcasterName,
            })}
            ref={(api) => {
              textAreaApi = api;
              props.ref?.({
                focus,
                insert: (text) => api.insert(text),
                replace: (text) => {
                  onInputChange(text);
                  queueMicrotask(() => {
                    focus();
                    setCursor(text.length);
                  });
                },
              });
            }}
            leading={
              <ComposerSlot>
                <ComposerActions
                  broadcasterId={props.broadcasterId}
                  anchorEl={() => textAreaApi?.anchorEl()}
                  onRunCommand={openCommandList}
                  onStartCommand={startCommand}
                />
              </ComposerSlot>
            }
            addons={
              <ComposerSlot>
                <CharCounter value={input} max={MAX_LEN} />
                <IconButton
                  label={t("CHAT_INPUT_EMOTE_PICKER")}
                  pressed={isOverlayOpen("emotePicker")}
                  {...{ [POPOVER_TOGGLE]: "" }}
                  onClick={() => toggleOverlay("emotePicker")}
                >
                  <Smile class="size-5" />
                </IconButton>
              </ComposerSlot>
            }
          >
            <ChatAutocomplete
              broadcasterId={props.broadcasterId}
              getValue={input}
              getCursor={getCursor}
              setValue={setInput}
              focus={focus}
              onCommandSelected={setCommandMode}
              ref={setAutocomplete}
            />
            <Show when={isOverlayOpen("emotePicker")}>
              <Suspense>
                <EmotePicker
                  onSelect={onEmoteSelect}
                  onClose={closeOverlay}
                  anchorEl={textAreaApi?.anchorEl()}
                />
              </Suspense>
            </Show>
          </ComposerField>
        }
      >
        {(cmd) => (
          <CommandComposer
            command={cmd()}
            ctx={{
              broadcasterId: props.broadcasterId,
              openUserCard: props.openUserCard,
            }}
            onSubmit={runCommand}
            onCancel={cancelCommand}
          />
        )}
      </Show>
    </div>
  );
}
