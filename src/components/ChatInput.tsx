import { createSignal, createMemo, Show, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { globalEmotes, userEmotes, buildThirdPartyEmoteMap } from "../emotes";
import EmotePicker from "./EmotePicker";
import EmoteSuggestions from "./EmoteSuggestions";

type ReplyTo = { messageId: string; name: string; text: string };

type Props = {
  broadcasterId: string;
  replyTo: () => ReplyTo | null;
  onClearReply: () => void;
  expose?: (api: { focus: () => void }) => void;
};

export default function ChatInput(props: Props) {
  const [input, setInput] = createSignal("");
  const [sending, setSending] = createSignal(false);
  const [pickerOpen, setPickerOpen] = createSignal(false);
  const [acQuery, setAcQuery] = createSignal<string | null>(null);
  let inputRef: HTMLInputElement | undefined;
  let acHandleKey: ((e: KeyboardEvent) => boolean) | undefined;

  onMount(() => {
    props.expose?.({ focus: () => inputRef?.focus() });
  });

  const allEmotes = createMemo<Record<string, string>>(() => {
    const map = buildThirdPartyEmoteMap();
    for (const e of userEmotes()) {
      if (!map[e.name]) map[e.name] = `https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/1.0`;
    }
    for (const e of globalEmotes()) {
      if (!map[e.name]) map[e.name] = e.images.url_1x;
    }
    return map;
  });

  const acSuggestions = () => {
    const q = acQuery();
    if (!q) return [];
    const lower = q.toLowerCase();
    const starts: { name: string; url: string }[] = [];
    const contains: { name: string; url: string }[] = [];
    for (const [name, url] of Object.entries(allEmotes())) {
      const n = name.toLowerCase();
      if (n.startsWith(lower)) starts.push({ name, url });
      else if (n.includes(lower)) contains.push({ name, url });
    }
    starts.sort((a, b) => a.name.localeCompare(b.name));
    contains.sort((a, b) => a.name.localeCompare(b.name));
    return [...starts, ...contains].slice(0, 10);
  };

  async function sendMessage() {
    const text = input().trim();
    if (!text || sending()) return;
    setSending(true);
    const reply = props.replyTo();
    try {
      await invoke("send_chat_message", {
        broadcasterId: props.broadcasterId,
        message: text,
        replyParentMessageId: reply?.messageId ?? null,
      });
      setInput("");
      props.onClearReply();
    } finally {
      setSending(false);
    }
  }

  function onInput(e: InputEvent) {
    const el = e.currentTarget as HTMLInputElement;
    setInput(el.value);
    const before = el.value.slice(0, el.selectionStart ?? el.value.length);
    const match = before.match(/(?:^|\s):(\w+)$/);
    if (match && match[1].length >= 1) setAcQuery(match[1]);
    else setAcQuery(null);
  }

  function selectAcSuggestion(name: string) {
    setAcQuery(null);
    if (!name) { inputRef?.focus(); return; }
    const cursor = inputRef?.selectionStart ?? input().length;
    const before = input().slice(0, cursor);
    const after = input().slice(cursor);
    setInput(
      before.replace(
        /(?:^|\s):(\w+)$/,
        (m) => (m.startsWith(":") ? "" : m[0]) + name + " ",
      ) + after,
    );
    inputRef?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (acHandleKey?.(e)) return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function insertEmote(value: string) {
    const cur = input();
    setInput((cur === "" || cur.endsWith(" ") ? cur : cur + " ") + value + " ");
    setPickerOpen(false);
  }

  return (
    <div class="shrink-0 border-t border-[#2d2d35]">
      <Show when={props.replyTo()}>
        <div class="flex items-center gap-2 px-4 py-2 bg-[#9146ff0f] border-b border-[#2d2d35]">
          <span class="text-xs text-[#6e6e8f] truncate min-w-0">
            ⌐ Replying to{" "}
            <span class="text-[#9146ff] font-semibold">@{props.replyTo()!.name}</span>
            {": "}
            {props.replyTo()!.text}
          </span>
          <button
            onClick={props.onClearReply}
            class="ml-auto shrink-0 text-[#5c5c7a] hover:text-white cursor-pointer transition-colors text-xs leading-none"
          >
            ✕
          </button>
        </div>
      </Show>
      <div class="relative flex items-center">
        <Show when={acSuggestions().length > 0}>
          <EmoteSuggestions
            suggestions={acSuggestions}
            onSelect={selectAcSuggestion}
            expose={(api) => { acHandleKey = api.handleKey; }}
          />
        </Show>
        <input
          ref={inputRef}
          type="text"
          value={input()}
          onInput={onInput}
          onKeyDown={onKeyDown}
          maxLength={500}
          placeholder="Send a message…"
          class="flex-1 bg-transparent text-[#efeff1] text-sm placeholder-[#5c5c7a] px-4 py-3 outline-none"
        />
        <button
          onClick={() => setPickerOpen((o) => !o)}
          class={`px-3 py-3 transition-colors cursor-pointer ${pickerOpen() ? "text-[#9146ff]" : "text-[#5c5c7a] hover:text-white"}`}
          title="Emote picker"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-3.5-7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-6.5 3.5c.828 1.165 2.05 1.5 3 1.5s2.172-.335 3-1.5H9z" />
          </svg>
        </button>
        <Show when={pickerOpen()}>
          <EmotePicker
            onSelect={insertEmote}
            onClose={() => setPickerOpen(false)}
          />
        </Show>
      </div>
    </div>
  );
}
