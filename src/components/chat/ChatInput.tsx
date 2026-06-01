import { Smile } from "lucide-solid";
import {
  createSignal,
  createEffect,
  Show,
  Suspense,
  lazy,
  onMount,
  onCleanup,
} from "solid-js";
import { shortcutManager } from "../../lib/managers/ShortcutManager.ts";
import { sendChatMessage } from "../../lib/api/twitch/chat.ts";
import type { Command } from "../command-composer/types.ts";
import CommandComposer from "../command-composer/CommandComposer.tsx";
import { ensureUserEmotesLoaded } from "../../lib/services/emotes.ts";
import { pushSentHistory, getSentHistory } from "../../lib/stores/chatHistory.ts";
import { isPanelOpen, setOpenPanel } from "../../lib/stores/ui.ts";
import TextArea, { type TextAreaApi } from "../ui/TextArea.tsx";
import Banner from "../ui/Banner.tsx";
import CharCounter from "../ui/CharCounter.tsx";
import Button from "../ui/Button.tsx";
const EmotePicker = lazy(() => import("../emotes/EmotePicker.tsx"));
import ChatAutocomplete, { type ChatAutocompleteHandle } from "./autocomplete/ChatAutocomplete.tsx";
import { createInputHistory } from "./createInputHistory.ts";
import { createUsernameTabComplete } from "./createUsernameTabComplete.ts";

const MAX_LEN = 500;

export type ReplyTo = { messageId: string; name: string; text: string };

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  isActive: boolean;
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
    if (!props.isActive) return;
    shortcutManager.setContext(
      "chat:popupOpen",
      (autocomplete()?.isActive() ?? false) || commandMode() !== null,
    );
  });

  createEffect(() => {
    if (!props.isActive) return;
    shortcutManager.setContext("chat:replyActive", props.replyTo() !== null);
    onCleanup(() => shortcutManager.setContext("chat:replyActive", false));
  });

  onMount(() => {
    props.ref?.({ focus, insert: (t) => textAreaApi?.insert(t) });
    ensureUserEmotesLoaded();
  });

  createEffect(() => {
    if (!props.isActive) return;
    const unbind = bindShortcuts();
    onCleanup(() => {
      for (const u of unbind) u();
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
              <div class="self-stretch flex flex-col items-center mx-2 py-3 shrink-0">
                <Button toggle="emotePicker" icon={<Smile class="w-5 h-5" />} title="Emote picker" />
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
            <Show when={isPanelOpen("emotePicker") && props.isActive}>
              <Suspense>
                <EmotePicker
                  onSelect={onEmoteSelect}
                  onClose={() => setOpenPanel(null)}
                  anchorEl={textAreaApi?.anchorEl()}
                />
              </Suspense>
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
