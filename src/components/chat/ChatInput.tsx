import { createSignal, createMemo, createEffect, Show, onMount, onCleanup } from "solid-js";
import { shortcutManager } from "../../managers/ShortcutManager";
import { sendChatMessage } from "../../commands/chat";
import { commands } from "../command-composer/commands";
import type { Command } from "../command-composer/types";
import CommandComposer from "../command-composer/CommandComposer";
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
import { ensureUserEmotesLoaded } from "../../services/emotes";
import EmotePicker from "../emotes/EmotePicker";
import Suggestions from "../suggestions/Suggestions";
import { chattersByChannel, isBroadcasterOfChannel, isModOfChannel } from "../../state/users";
import { feedUserNickname } from "../../state/preferences";
import { isPanelOpen, setOpenPanel, togglePanel } from "../../state/ui";
import SmileIcon from "../../icons/SmileIcon";
import { pushSentHistory, getSentHistory } from "../../state/chatHistory";

type ReplyTo = { messageId: string; name: string; text: string };

function canRunCommand(cmd: Command, broadcasterId: string): boolean {
  if (cmd.role === "regular") return true;
  if (cmd.role === "broadcaster") return isBroadcasterOfChannel(broadcasterId);
  return isModOfChannel(broadcasterId);
}

type Props = {
  broadcasterId: string;
  broadcasterLogin: string;
  replyTo: () => ReplyTo | null;
  onClearReply: () => void;
  openUserCard: (userId: string) => void;
  expose?: (api: { focus: () => void; insert: (text: string) => void }) => void;
};

export default function ChatInput(props: Props) {
  const [input, setInput] = createSignal("");
  const [sending, setSending] = createSignal(false);
  const [acQuery, setAcQuery] = createSignal<string | null>(null);
  const [mentionQuery, setMentionQuery] = createSignal<string | null>(null);
  const [commandQuery, setCommandQuery] = createSignal<string | null>(null);
  const [commandMode, setCommandMode] = createSignal<Command | null>(null);
  let inputRef: HTMLTextAreaElement | undefined;
  let rowRef: HTMLDivElement | undefined;
  let acHandleKey: ((e: KeyboardEvent) => boolean) | undefined;
  let mentionHandleKey: ((e: KeyboardEvent) => boolean) | undefined;
  let commandHandleKey: ((e: KeyboardEvent) => boolean) | undefined;
  let tabCycle: { matches: string[]; index: number; start: number; end: number } | null = null;
  let historyIndex = -1;
  let savedDraft = "";

  let inputBaseH = 0;

  function autoResize() {
    const el = inputRef;
    if (!el) return;
    el.style.height = "";
    const sh = el.scrollHeight;
    if (!inputBaseH) inputBaseH = sh;
    if (sh > inputBaseH) {
      el.style.height = Math.min(sh, 200) + "px";
    }
  }

  function insertText(value: string) {
    const cur = input();
    setInput((cur === "" || cur.endsWith(" ") ? cur : cur + " ") + value + " ");
    inputRef?.focus();
    queueMicrotask(autoResize);
  }

  onMount(() => {
    props.expose?.({ focus: () => inputRef?.focus(), insert: insertText });
    ensureUserEmotesLoaded();
    autoResize();
    createEffect(() => {
      shortcutManager.setContext(
        "chat:popupOpen",
        commandQuery() !== null
          || mentionQuery() !== null
          || acQuery() !== null
          || commandMode() !== null,
      );
    });
    const WHEN = "chat:focused && !chat:popupOpen";
    const unbind = [
      shortcutManager.register("chat::send", () => { void sendMessage(); }, WHEN),
      shortcutManager.register("chat::tabComplete", () => tabComplete(), WHEN),
      shortcutManager.register("chat::recallPrev", () => {
        if (input().slice(0, inputRef?.selectionStart ?? 0).includes("\n")) return false;
        return stepHistory(1);
      }, WHEN),
      shortcutManager.register("chat::recallNext", () => {
        if (input().slice(inputRef?.selectionEnd ?? 0).includes("\n")) return false;
        return stepHistory(-1);
      }, WHEN),
    ];
    onCleanup(() => { for (const u of unbind) u(); });
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
    for (const c of commands) {
      if (!canRunCommand(c, props.broadcasterId)) continue;
      const usage = c.options
        .map((o) => (o.required === false ? `[${o.name}?]` : `[${o.name}]`))
        .join(" ");
      const item = { name: c.name, usage, description: c.description };
      if (lower === "" || c.name.startsWith(lower)) starts.push(item);
      else if (c.name.includes(lower)) contains.push(item);
    }
    starts.sort((a, b) => a.name.localeCompare(b.name));
    contains.sort((a, b) => a.name.localeCompare(b.name));
    return [...starts, ...contains];
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
        historyIndex = -1;
        savedDraft = "";
        setInput("");
        queueMicrotask(autoResize);
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
    queueMicrotask(autoResize);
    try {
      await cmd.execute(values, {
        broadcasterId: props.broadcasterId,
        broadcasterLogin: props.broadcasterLogin,
        openUserCard: props.openUserCard,
      });
    } catch (e) {
      console.error(`/${cmd.name} failed`, e);
    }
    inputRef?.focus();
  }

  function cancelCommand() {
    setCommandMode(null);
    setInput("");
    queueMicrotask(() => {
      autoResize();
      inputRef?.focus();
    });
  }

  function stepHistory(delta: 1 | -1): boolean {
    const arr = getSentHistory(props.broadcasterId);
    if (!arr?.length) return false;
    const next = historyIndex + delta;
    if (next < -1 || next >= arr.length) return false;
    if (historyIndex === -1) savedDraft = input();
    historyIndex = next;
    const text = next === -1 ? savedDraft : arr[next];
    setInput(text);
    queueMicrotask(() => {
      autoResize();
      inputRef?.setSelectionRange(text.length, text.length);
    });
    return true;
  }

  function tabComplete() {
    if (!tabCycle) {
      const cursor = inputRef?.selectionStart ?? input().length;
      const partial = input().slice(0, cursor).match(/\S+$/)?.[0];
      if (!partial) return;
      const bucket = chattersByChannel.get(props.broadcasterId);
      if (!bucket) return;
      const lower = partial.toLowerCase();
      const matches = [...bucket.values()]
        .filter((c) => {
          const nick = feedUserNickname(c.login)?.toLowerCase();
          return c.login.toLowerCase().startsWith(lower)
            || c.displayName.toLowerCase().startsWith(lower)
            || (nick !== undefined && nick.startsWith(lower));
        })
        .sort((a, b) => b.lastSeen - a.lastSeen)
        .map((c) => c.displayName);
      if (matches.length === 0) return;
      tabCycle = { matches, index: 0, start: cursor - partial.length, end: cursor };
    } else {
      tabCycle.index = (tabCycle.index + 1) % tabCycle.matches.length;
    }
    const name = tabCycle.matches[tabCycle.index];
    const v = input();
    setInput(v.slice(0, tabCycle.start) + name + v.slice(tabCycle.end));
    tabCycle.end = tabCycle.start + name.length;
    const c = tabCycle.end;
    queueMicrotask(() => inputRef?.setSelectionRange(c, c));
  }

  function onInput(e: InputEvent) {
    tabCycle = null;
    historyIndex = -1;
    savedDraft = "";
    const el = e.currentTarget as HTMLTextAreaElement;
    setInput(el.value);
    autoResize();
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
    const cmd = commands.find((c) => c.name === s.name);
    if (!cmd) {
      setInput("");
      inputRef?.focus();
      return;
    }
    setInput("");
    setCommandMode(cmd);
  }

  function dismissAc() { setAcQuery(null); inputRef?.focus(); }
  function dismissMention() { setMentionQuery(null); inputRef?.focus(); }
  function dismissCommand() { setCommandQuery(null); inputRef?.focus(); }

  function onKeyDown(e: KeyboardEvent) {
    if (commandHandleKey?.(e)) return;
    if (mentionHandleKey?.(e)) return;
    if (acHandleKey?.(e)) return;
  }

  function insertEmote(value: string, opts?: { keepOpen?: boolean }) {
    const cur = input();
    setInput((cur === "" || cur.endsWith(" ") ? cur : cur + " ") + value + " ");
    queueMicrotask(autoResize);
    if (!opts?.keepOpen) {
      setOpenPanel(null);
      inputRef?.focus();
    }
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
      <div ref={rowRef} class="relative flex items-end min-h-14">
        <Show when={commandSuggestions().length > 0}>
          <Suggestions<CommandSuggestion>
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
          <Suggestions<MentionSuggestion>
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
          <Suggestions<EmoteSuggestion>
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
        <Show
          when={commandMode()}
          fallback={
            <>
              <textarea
                ref={inputRef}
                rows={1}
                value={input()}
                onInput={onInput}
                onKeyDown={onKeyDown}
                onFocus={() => shortcutManager.setContext("chat:focused", true)}
                onBlur={() => shortcutManager.setContext("chat:focused", false)}
                maxLength={500}
                placeholder={`Message #${props.broadcasterLogin}`}
                class="flex-1 self-stretch content-center bg-transparent text-text text-base placeholder-text-muted/60 pl-4 pr-0 py-3 outline-none resize-none overflow-y-auto leading-snug"
              />
              <div class="self-stretch flex flex-col items-center mx-2 py-2.5 shrink-0">
                <button
                  data-emote-picker-toggle
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => togglePanel("emotePicker")}
                  class={`flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer ${
                    isPanelOpen("emotePicker") ? "text-text bg-bg-light" : "text-text-muted hover:bg-bg hover:text-text"
                  }`}
                  title="Emote picker"
                >
                  <SmileIcon class="w-5 h-5" />
                </button>
                <Show when={input().length >= 400}>
                  <span
                    class={`mt-auto text-xs font-medium tabular-nums ${
                      input().length >= 500 ? "text-danger" : "text-text-muted"
                    }`}
                  >
                    {500 - input().length}
                  </span>
                </Show>
              </div>
              <Show when={isPanelOpen("emotePicker")}>
                <EmotePicker
                  onSelect={insertEmote}
                  onClose={() => setOpenPanel(null)}
                  anchorEl={rowRef}
                />
              </Show>
            </>
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
    </div>
  );
}
