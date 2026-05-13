import { createSignal, createMemo, Show, onMount } from "solid-js";
import { sendChatMessage } from "../../commands/chat";
import { chatCommands, executeChatCommand, buildUsage } from "./commands";
import {
  globalEmotes,
  userEmotes,
  sevenTvGlobal,
  bttvGlobal,
  ffzGlobal,
  sevenTvChannel,
  bttvChannel,
  ffzChannel,
} from "../../state/emotes";
import EmotePicker from "../emotes/EmotePicker";
import FeedSuggestions from "./FeedSuggestions";
import { chattersByChannel } from "../../state/users";
import { feedUserNickname } from "../../state/preferences";
import SmileIcon from "../../icons/SmileIcon";

type ReplyTo = { messageId: string; name: string; text: string };

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  replyTo: () => ReplyTo | null;
  onClearReply: () => void;
  openUserCard: (userId: string) => void;
  expose?: (api: { focus: () => void; insert: (text: string) => void }) => void;
};

export default function FeedInput(props: Props) {
  const [input, setInput] = createSignal("");
  const [sending, setSending] = createSignal(false);
  const [pickerOpen, setPickerOpen] = createSignal(false);
  const [acQuery, setAcQuery] = createSignal<string | null>(null);
  const [mentionQuery, setMentionQuery] = createSignal<string | null>(null);
  const [commandQuery, setCommandQuery] = createSignal<string | null>(null);
  let inputRef: HTMLInputElement | undefined;
  let acHandleKey: ((e: KeyboardEvent) => boolean) | undefined;
  let mentionHandleKey: ((e: KeyboardEvent) => boolean) | undefined;
  let commandHandleKey: ((e: KeyboardEvent) => boolean) | undefined;

  function insertText(value: string) {
    const cur = input();
    setInput((cur === "" || cur.endsWith(" ") ? cur : cur + " ") + value + " ");
    inputRef?.focus();
  }

  onMount(() => {
    props.expose?.({ focus: () => inputRef?.focus(), insert: insertText });
  });

  type Source = "Twitch" | "7TV" | "BetterTTV" | "FrankerFaceZ";
  type EmoteEntry = { url: string; source: Source };
  type EmoteSuggestion = { name: string; url: string; source: Source };
  type MentionSuggestion = { login: string; displayName: string; color: string; nickname?: string };
  type CommandSuggestion = { name: string; usage?: string; description: string };

  const allEmotes = createMemo<Record<string, EmoteEntry>>(() => {
    const map: Record<string, EmoteEntry> = {};
    const add = (name: string, url: string, source: Source) => {
      if (!map[name]) map[name] = { url, source };
    };
    for (const e of sevenTvChannel()) add(e.name, e.url, "7TV");
    for (const e of bttvChannel()) add(e.name, e.url, "BetterTTV");
    for (const e of ffzChannel()) add(e.name, e.url, "FrankerFaceZ");
    for (const e of sevenTvGlobal()) add(e.name, e.url, "7TV");
    for (const e of bttvGlobal()) add(e.name, e.url, "BetterTTV");
    for (const e of ffzGlobal()) add(e.name, e.url, "FrankerFaceZ");
    for (const e of userEmotes()) {
      add(e.name, `https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/1.0`, "Twitch");
    }
    for (const e of globalEmotes()) add(e.name, e.images.url_1x, "Twitch");
    return map;
  });

  const acSuggestions = (): EmoteSuggestion[] => {
    const q = acQuery();
    if (!q) return [];
    const lower = q.toLowerCase();
    const starts: EmoteSuggestion[] = [];
    const contains: EmoteSuggestion[] = [];
    for (const [name, entry] of Object.entries(allEmotes())) {
      const n = name.toLowerCase();
      if (n.startsWith(lower)) starts.push({ name, url: entry.url, source: entry.source });
      else if (n.includes(lower)) contains.push({ name, url: entry.url, source: entry.source });
    }
    starts.sort((a, b) => a.name.localeCompare(b.name));
    contains.sort((a, b) => a.name.localeCompare(b.name));
    return [...starts, ...contains].slice(0, 10);
  };

  const commandSuggestions = (): CommandSuggestion[] => {
    const q = commandQuery();
    if (q === null) return [];
    const lower = q.toLowerCase();
    const starts: CommandSuggestion[] = [];
    const contains: CommandSuggestion[] = [];
    for (const c of chatCommands) {
      const item = { name: c.name, usage: buildUsage(c.options), description: c.description };
      if (lower === "" || c.name.startsWith(lower)) starts.push(item);
      else if (c.name.includes(lower)) contains.push(item);
    }
    starts.sort((a, b) => a.name.localeCompare(b.name));
    contains.sort((a, b) => a.name.localeCompare(b.name));
    return [...starts, ...contains].slice(0, 10);
  };

  const mentionSuggestions = (): MentionSuggestion[] => {
    const q = mentionQuery();
    if (q === null) return [];
    const bucket = chattersByChannel.get(props.broadcasterId);
    if (!bucket) return [];
    const lower = q.toLowerCase();
    type Ranked = { login: string; displayName: string; color: string; nickname?: string; lastSeen: number };
    const starts: Ranked[] = [];
    const contains: Ranked[] = [];
    for (const c of bucket.values()) {
      const nickname = feedUserNickname(c.login);
      const l = c.login.toLowerCase();
      const d = c.displayName.toLowerCase();
      const n = nickname?.toLowerCase();
      const ranked: Ranked = { login: c.login, displayName: c.displayName, color: c.color, nickname, lastSeen: c.lastSeen };
      if (lower === "" || l.startsWith(lower) || d.startsWith(lower) || n?.startsWith(lower)) {
        starts.push(ranked);
      } else if (l.includes(lower) || d.includes(lower) || (n && n.includes(lower))) {
        contains.push(ranked);
      }
    }
    starts.sort((a, b) => b.lastSeen - a.lastSeen);
    contains.sort((a, b) => b.lastSeen - a.lastSeen);
    return [...starts, ...contains]
      .slice(0, 10)
      .map(({ lastSeen: _, ...rest }) => rest);
  };

  async function sendMessage() {
    const text = input().trim();
    if (!text || sending()) return;
    setSending(true);
    try {
      const handled = await executeChatCommand(text, {
        broadcasterId: props.broadcasterId,
        broadcasterLogin: props.broadcasterLogin,
        openUserCard: props.openUserCard,
      });
      if (handled) {
        setInput("");
        return;
      }
      const reply = props.replyTo();
      const ok = await sendChatMessage({
        broadcasterId: props.broadcasterId,
        message: text,
        replyParentMessageId: reply?.messageId ?? null,
      });
      if (ok) {
        setInput("");
        props.onClearReply();
      }
    } finally {
      setSending(false);
    }
  }

  function onInput(e: InputEvent) {
    const el = e.currentTarget as HTMLInputElement;
    setInput(el.value);
    const before = el.value.slice(0, el.selectionStart ?? el.value.length);
    const commandMatch = before.match(/^\/(\w*)$/);
    const emoteMatch = before.match(/(?:^|\s):(\w+)$/);
    const mentionMatch = before.match(/(?:^|\s)@(\w*)$/);
    if (commandMatch) {
      setCommandQuery(commandMatch[1]);
      setAcQuery(null);
      setMentionQuery(null);
    } else if (emoteMatch && emoteMatch[1].length >= 1) {
      setAcQuery(emoteMatch[1]);
      setMentionQuery(null);
      setCommandQuery(null);
    } else if (mentionMatch && mentionMatch[1].length >= 1) {
      setMentionQuery(mentionMatch[1]);
      setAcQuery(null);
      setCommandQuery(null);
    } else {
      setAcQuery(null);
      setMentionQuery(null);
      setCommandQuery(null);
    }
  }

  function selectAcSuggestion(s: EmoteSuggestion) {
    setAcQuery(null);
    const cursor = inputRef?.selectionStart ?? input().length;
    const before = input().slice(0, cursor);
    const after = input().slice(cursor);
    setInput(
      before.replace(
        /(?:^|\s):(\w+)$/,
        (m) => (m.startsWith(":") ? "" : m[0]) + s.name + " ",
      ) + after,
    );
    inputRef?.focus();
  }

  function selectMention(s: MentionSuggestion) {
    setMentionQuery(null);
    const cursor = inputRef?.selectionStart ?? input().length;
    const before = input().slice(0, cursor);
    const after = input().slice(cursor);
    setInput(
      before.replace(
        /(?:^|\s)@(\w*)$/,
        (m) => (m.startsWith("@") ? "" : m[0]) + "@" + s.login + " ",
      ) + after,
    );
    inputRef?.focus();
  }

  function selectCommand(s: CommandSuggestion) {
    setCommandQuery(null);
    setInput(`/${s.name} `);
    inputRef?.focus();
  }

  function dismissAc() { setAcQuery(null); inputRef?.focus(); }
  function dismissMention() { setMentionQuery(null); inputRef?.focus(); }
  function dismissCommand() { setCommandQuery(null); inputRef?.focus(); }

  function onKeyDown(e: KeyboardEvent) {
    if (commandHandleKey?.(e)) return;
    if (mentionHandleKey?.(e)) return;
    if (acHandleKey?.(e)) return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function insertEmote(value: string) {
    const cur = input();
    setInput((cur === "" || cur.endsWith(" ") ? cur : cur + " ") + value + " ");
    setPickerOpen(false);
  }

  return (
    <div class="shrink-0 border-t border-border-muted">
      <Show when={props.replyTo()}>
        <div class="flex items-center gap-2 px-4 py-2 bg-primary/6 border-b border-border-muted">
          <span class="text-xs text-text-muted truncate min-w-0">
            ⌐ Replying to{" "}
            <span class="text-primary font-semibold">@{props.replyTo()!.name}</span>
            {": "}
            {props.replyTo()!.text}
          </span>
          <button
            onClick={props.onClearReply}
            class="ml-auto shrink-0 text-text-muted hover:text-text cursor-pointer transition-colors text-xs leading-none"
          >
            ✕
          </button>
        </div>
      </Show>
      <div class="relative flex items-center h-14">
        <Show when={commandSuggestions().length > 0}>
          <FeedSuggestions<CommandSuggestion>
            suggestions={commandSuggestions}
            onSelect={selectCommand}
            onDismiss={dismissCommand}
            renderItem={(s) => (
              <div class="flex flex-col flex-1 min-w-0 text-left">
                <div class="flex items-baseline gap-2 min-w-0">
                  <span class="font-semibold text-text truncate">/{s.name}</span>
                  <Show when={s.usage}>
                    <span class="text-xs text-text-muted truncate">{s.usage}</span>
                  </Show>
                </div>
                <span class="text-xs text-text-muted truncate">{s.description}</span>
              </div>
            )}
            expose={(api) => { commandHandleKey = api.handleKey; }}
          />
        </Show>
        <Show when={mentionSuggestions().length > 0}>
          <FeedSuggestions<MentionSuggestion>
            suggestions={mentionSuggestions}
            onSelect={selectMention}
            onDismiss={dismissMention}
            renderItem={(s) => (
              <>
                <span class="font-semibold text-left truncate" style={{ color: s.color || "var(--color-text)" }}>
                  {s.nickname ?? s.displayName}
                </span>
                <Show when={s.nickname}>
                  <span class="text-text-muted text-sm truncate">({s.displayName})</span>
                </Show>
                <span class="flex-1" />
                <span class="text-xs font-semibold shrink-0 text-text-muted">
                  {s.displayName.toLowerCase() !== s.login ? s.login : ""}
                </span>
              </>
            )}
            expose={(api) => { mentionHandleKey = api.handleKey; }}
          />
        </Show>
        <Show when={acSuggestions().length > 0}>
          <FeedSuggestions<EmoteSuggestion>
            suggestions={acSuggestions}
            onSelect={selectAcSuggestion}
            onDismiss={dismissAc}
            renderItem={(s) => (
              <>
                <img src={s.url} alt={s.name} class="w-6 h-6 object-contain shrink-0" />
                <span class="text-text flex-1 text-left truncate">{s.name}</span>
                <span class="text-xs font-semibold shrink-0 text-text-muted">{s.source}</span>
              </>
            )}
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
          placeholder={`Message #${props.broadcasterLogin}`}
          class="flex-1 bg-transparent text-text text-base placeholder-text-muted/60 px-4 py-3 outline-none"
        />
        <button
          onClick={() => setPickerOpen((o) => !o)}
          class={`flex items-center justify-center w-9 h-9 mx-2.5 rounded-md transition-colors cursor-pointer shrink-0 ${
            pickerOpen() ? "text-primary" : "text-text-muted hover:bg-bg-light hover:text-text"
          }`}
          title="Emote picker"
        >
          <SmileIcon class="w-5 h-5" />
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
