import { Rows2, SendHorizontal, Smile, X } from "lucide-solid";
import {
  createEffect,
  createSignal,
  lazy,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import { POPOVER_TOGGLE } from "../../lib/primitives/dismissOnOutside.ts";
import * as chat from "../../lib/services/chat.ts";
import type { Command } from "../command-composer/types.ts";
import type { FeedMessage as Message } from "../../lib/types/index.ts";
import CommandComposer from "../command-composer/CommandComposer.tsx";
import * as emotes from "../../lib/services/emotes.ts";
import {
  getSentHistory,
  pushSentHistory,
} from "../../lib/stores/chatHistory.ts";
import { getDraft, setDraft } from "../../lib/stores/drafts.ts";
import {
  feedDensity,
  toggleFeedDensity,
} from "../../lib/stores/preferences.ts";
import {
  closeOverlay,
  isOverlayOpen,
  toggleOverlay,
} from "../../lib/stores/ui.ts";
import ComposerField, { type ComposerFieldApi } from "./ComposerField.tsx";
import Button from "../ui/Button.tsx";
import CharCounter from "./CharCounter.tsx";
import IconButton from "../ui/IconButton.tsx";
import { composerInnerHeight } from "../ui/rowHeight.ts";
import { keyLabels } from "../../lib/utils/keyboard.ts";
const EmotePicker = lazy(() => import("../emotes/EmotePicker.tsx"));
import ChatAutocomplete, {
  type ChatAutocompleteHandle,
} from "./autocomplete/ChatAutocomplete.tsx";
import { createInputHistory } from "./createInputHistory.ts";
import { createUsernameTabComplete } from "./createUsernameTabComplete.ts";
import ChatModes from "./ChatModes.tsx";

const MAX_LEN = 500;
const SEND_ACTION = "chat::send";
const DENSITY_ACTION = "feed::toggleDensity";

function withShortcut(label: string, action: string): string {
  const combo = shortcuts.keysFor(action);
  return combo ? `${label} (${keyLabels(combo).join("+")})` : label;
}

export type ReplyTo = { messageId: string; name: string; text: string };

export type ChatInputApi = {
  focus: () => void;
  insert: (text: string) => void;
  replace: (text: string) => void;
};

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
  isActive: boolean;
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
  const [autocomplete, setAutocomplete] = createSignal<
    ChatAutocompleteHandle | null
  >(null);
  const [mentionIdx, setMentionIdx] = createSignal(0);
  let textAreaApi: ComposerFieldApi | undefined;

  const focus = () => textAreaApi?.focus();
  const getCursor = () =>
    textAreaApi?.textareaEl()?.selectionStart ?? input().length;
  const setCursor = (pos: number) =>
    textAreaApi?.textareaEl()?.setSelectionRange(pos, pos);
  const setFocused = (b: boolean) => shortcuts.setContext("chat:focused", b);

  const history = createInputHistory({
    history: () => getSentHistory(props.broadcasterId) ?? [],
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

  const outgoing = () => input().replace(/\s*\n\s*/g, " ").trim();
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
        pushSentHistory(props.broadcasterId, text);
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
    try {
      await cmd.execute(values, {
        broadcasterId: props.broadcasterId,
        broadcasterLogin: props.broadcasterLogin,
        openUserCard: props.openUserCard,
      });
    } catch (e) {
      console.error(`/${cmd.name} failed`, e);
    }
    queueMicrotask(focus);
  }

  function cancelCommand() {
    setCommandMode(null);
    setInput("");
    queueMicrotask(focus);
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
    return input().slice(0, el?.selectionStart ?? 0).includes("\n");
  }

  function hasNewlineAfterCursor() {
    const el = textAreaApi?.textareaEl();
    return input().slice(el?.selectionEnd ?? 0).includes("\n");
  }

  function bindShortcuts() {
    const WHEN = "chat:focused && !chat:popupOpen";
    return [
      shortcuts.register(SEND_ACTION, () => {
        void sendMessage();
      }, WHEN),
      shortcuts.register("chat::tabComplete", () => {
        if (input().trim() === "") {
          const mentions = props.getMentions();
          if (mentions.length === 0) return;
          const idx = Math.min(mentionIdx(), mentions.length - 1);
          props.onReplyMention(mentions[idx]);
          setMentionIdx(idx + 1);
          return;
        }
        tabComplete.complete();
      }, WHEN),
      shortcuts.register("chat::recallPrev", () => {
        if (hasNewlineBeforeCursor()) return false;
        return history.step(1);
      }, WHEN),
      shortcuts.register("chat::recallNext", () => {
        if (hasNewlineAfterCursor()) return false;
        return history.step(-1);
      }, WHEN),
      shortcuts.registerLocal("escape", () => {
        props.onClearReply();
      }, "chat:replyActive"),
    ];
  }

  createEffect(() => {
    if (!props.isActive) return;
    shortcuts.setContext(
      "chat:popupOpen",
      (autocomplete()?.isActive() ?? false) || commandMode() !== null,
    );
  });

  createEffect(() => {
    if (props.replyTo() === null) setMentionIdx(0);
  });

  createEffect(() => {
    if (!props.isActive) return;
    shortcuts.setContext("chat:replyActive", props.replyTo() !== null);
    onCleanup(() => shortcuts.setContext("chat:replyActive", false));
  });

  onMount(() => {
    emotes.ensureUserLoaded();
  });

  createEffect(() => {
    if (!props.isActive) return;
    const unbind = bindShortcuts();
    onCleanup(() => {
      for (const u of unbind) u();
    });
  });

  return (
    <div class="shrink-0 bg-surface border-t border-line-soft px-4 pt-3 pb-3">
      <ChatModes broadcasterId={props.broadcasterId} />
      <Show when={props.replyTo()}>
        {(reply) => (
          <div class="flex items-center gap-2 px-1 pb-2 text-small text-ink-soft">
            <span class="shrink-0">
              Replying to{" "}
              <span class="font-semibold text-ink">{reply().name}</span>
            </span>
            <span class="flex-1 min-w-0 truncate">{reply().text}</span>
            <IconButton
              label="Cancel reply"
              size="sm"
              onClick={props.onClearReply}
            >
              <X class="size-4" />
            </IconButton>
          </div>
        )}
      </Show>
      <Show
        when={commandMode()}
        fallback={
          <ComposerField
            value={input()}
            onInput={onInputChange}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={MAX_LEN}
            placeholder={`Message #${props.broadcasterName}`}
            ref={(api) => {
              textAreaApi = api;
              props.ref?.({
                focus,
                insert: (t) => api.insert(t),
                replace: (t) => {
                  onInputChange(t);
                  queueMicrotask(() => {
                    focus();
                    setCursor(t.length);
                  });
                },
              });
            }}
            addons={
              <div
                class={`flex items-center gap-1 shrink-0 self-end ${composerInnerHeight()}`}
              >
                <CharCounter value={input} max={MAX_LEN} />
                <IconButton
                  label={withShortcut("Spacious layout", DENSITY_ACTION)}
                  pressed={feedDensity() === "comfortable"}
                  onClick={toggleFeedDensity}
                >
                  <Rows2 class="size-5" />
                </IconButton>
                <IconButton
                  label="Emote picker"
                  pressed={isOverlayOpen("emotePicker")}
                  {...{ [POPOVER_TOGGLE]: "" }}
                  onClick={() => toggleOverlay("emotePicker")}
                >
                  <Smile class="size-5" />
                </IconButton>
                <Button
                  variant={outgoing() && !tooLong() ? "accent" : "ghost"}
                  icon={<SendHorizontal class="size-4" />}
                  aria-label="Send"
                  title={tooLong()
                    ? `Too long: Twitch allows ${MAX_LEN} characters`
                    : "Send"}
                  disabled={tooLong()}
                  loading={sending()}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void sendMessage()}
                />
              </div>
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
            <Show when={isOverlayOpen("emotePicker") && props.isActive}>
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
              broadcasterLogin: props.broadcasterLogin,
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
