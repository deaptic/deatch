import { createSignal, createEffect, Show, onMount, onCleanup } from "solid-js";
import { shortcutManager } from "../../managers/ShortcutManager";
import { sendChatMessage } from "../../commands/twitch/chat";
import type { Command } from "../command-composer/types";
import CommandComposer from "../command-composer/CommandComposer";
import { ensureUserEmotesLoaded } from "../../services/emotes";
import { pushSentHistory, getSentHistory } from "../../state/chatHistory";
import { isPanelOpen, setOpenPanel } from "../../state/ui";
import TextArea, { type TextAreaApi } from "../../ui/TextArea";
import Banner from "../../ui/Banner";
import CharCounter from "../../ui/CharCounter";
import Button from "../../ui/Button";
import SmileIcon from "../../icons/SmileIcon";
import EmotePicker from "../emotes/EmotePicker";
import ChatAutocomplete, { type ChatAutocompleteHandle } from "./autocomplete/ChatAutocomplete";
import { createInputHistory } from "./createInputHistory";
import { createUsernameTabComplete } from "./createUsernameTabComplete";

const MAX_LEN = 500;

export type ReplyTo = { messageId: string; name: string; text: string };

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  replyTo: () => ReplyTo | null;
  onClearReply: () => void;
  openUserCard: (userId: string) => void;
  ref?: (api: { focus: () => void; insert: (text: string) => void }) => void;
};

export default function ChatInput(props: Props) {
  const [input, setInput] = createSignal("");
  const [sending, setSending] = createSignal(false);
  const [commandMode, setCommandMode] = createSignal<Command | null>(null);
  const [autocomplete, setAutocomplete] = createSignal<ChatAutocompleteHandle | null>(null);
  let textAreaApi: TextAreaApi | undefined;

  const focus = () => textAreaApi?.focus();
  const getCursor = () => textAreaApi?.textareaEl()?.selectionStart ?? input().length;
  const setCursor = (pos: number) => textAreaApi?.textareaEl()?.setSelectionRange(pos, pos);
  const setFocused = (b: boolean) => shortcutManager.setContext("chat:focused", b);

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

  async function sendMessage() {
    const text = input().replace(/\s*\n\s*/g, " ").trim();
    if (!text || sending()) return;
    setSending(true);
    try {
      const reply = props.replyTo();
      const ok = await sendChatMessage({
        broadcasterId: props.broadcasterId,
        message: text,
        replyParentMessageId: reply?.messageId ?? null,
      });
      if (ok) {
        pushSentHistory(props.broadcasterId, text);
        history.reset();
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
    setInput(value);
    autocomplete()?.update(value, getCursor());
  }

  function onKeyDown(e: KeyboardEvent) {
    autocomplete()?.handleKey(e);
  }

  function onEmoteSelect(value: string, opts?: { keepOpen?: boolean }) {
    textAreaApi?.insert(value);
    if (!opts?.keepOpen) setOpenPanel(null);
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
      shortcutManager.register("chat::send", () => { void sendMessage(); }, WHEN),
      shortcutManager.register("chat::tabComplete", () => { tabComplete.complete(); }, WHEN),
      shortcutManager.register("chat::recallPrev", () => {
        if (hasNewlineBeforeCursor()) return false;
        return history.step(1);
      }, WHEN),
      shortcutManager.register("chat::recallNext", () => {
        if (hasNewlineAfterCursor()) return false;
        return history.step(-1);
      }, WHEN),
      shortcutManager.registerLocal("escape", () => { props.onClearReply(); }, "chat:replyActive"),
    ];
  }

  createEffect(() => {
    shortcutManager.setContext(
      "chat:popupOpen",
      (autocomplete()?.isActive() ?? false) || commandMode() !== null,
    );
  });

  createEffect(() => {
    shortcutManager.setContext("chat:replyActive", props.replyTo() !== null);
  });

  onMount(() => {
    props.ref?.({ focus, insert: (t) => textAreaApi?.insert(t) });
    ensureUserEmotesLoaded();
    const unbind = bindShortcuts();
    onCleanup(() => {
      for (const u of unbind) u();
      shortcutManager.setContext("chat:replyActive", false);
    });
  });

  return (
    <div class="shrink-0 border-t border-border-muted">
      <Show when={props.replyTo()}>
        <Banner onDismiss={props.onClearReply}>
          ⌐ Replying to{" "}
          <span class="text-primary font-semibold">@{props.replyTo()!.name}</span>
          {": "}
          {props.replyTo()!.text}
        </Banner>
      </Show>
      <Show
        when={commandMode()}
        fallback={
          <TextArea
            value={input()}
            onInput={onInputChange}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={MAX_LEN}
            placeholder={`Message #${props.broadcasterLogin}`}
            ref={(api) => { textAreaApi = api; }}
            addons={
              <div class="self-stretch flex flex-col items-center mx-2 py-2.5 shrink-0">
                <Button toggle="emotePicker" icon={<SmileIcon class="w-5 h-5" />} title="Emote picker" />
                <CharCounter value={input} max={MAX_LEN} class="mt-auto" />
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
            <Show when={isPanelOpen("emotePicker")}>
              <EmotePicker
                onSelect={onEmoteSelect}
                onClose={() => setOpenPanel(null)}
                anchorEl={textAreaApi?.anchorEl()}
              />
            </Show>
          </TextArea>
        }
      >
        {(cmd) => (
          <div class="relative flex items-end min-h-14">
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
          </div>
        )}
      </Show>
    </div>
  );
}
