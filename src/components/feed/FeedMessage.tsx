import { For, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import { EmoteMap } from "../../emotes";
import { badgeCategoryFor, type BadgeCategoryKey } from "../../constants";
import FeedMessageToolbar from "./FeedMessageToolbar";
import type { FeedMessage as Message, Fragment, BadgeMap } from "./types";

type Reaction = { label: string; value: string; url: string };

type Props = {
  item: Message;
  emotes: EmoteMap;
  badges: BadgeMap;
  badgePrefs: Record<BadgeCategoryKey, { show: boolean }>;
  userLogin: string;
  useDisplayName?: boolean;
  showTimestamp?: boolean;
  reactions: Reaction[];
  onContextMenu: (x: number, y: number, msg: Message) => void;
  onReply: (msg: Message) => void;
  onReact: (msg: Message, value: string) => void;
};

const INLINE_EMOTE =
  "inline-block h-[1.4em] w-auto max-w-[4em] object-contain align-top mt-[0.1em] mx-0.5";

const URL_RE = /^https?:\/\/\S+$/;

function TextWithEmotes(props: { text: string; emotes: EmoteMap }) {
  const tokens = () => props.text.split(/(\s+)/);
  return (
    <For each={tokens()}>
      {(token) => {
        const emoteUrl = props.emotes[token];
        if (emoteUrl)
          return (
            <img
              src={emoteUrl}
              alt={token}
              title={token}
              class={INLINE_EMOTE}
            />
          );
        if (URL_RE.test(token))
          return (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                openUrl(token);
              }}
              class="text-[#9146ff] hover:underline break-all"
            >
              {token}
            </a>
          );
        return <span class="text-[#efeff1]">{token}</span>;
      }}
    </For>
  );
}

function renderFragment(frag: Fragment, emotes: EmoteMap) {
  switch (frag.type) {
    case "emote":
      return (
        <img
          src={`https://static-cdn.jtvnw.net/emoticons/v2/${frag.id}/default/dark/1.0`}
          alt={frag.text}
          title={frag.text}
          class={INLINE_EMOTE}
        />
      );
    case "mention":
      return (
        <span
          class="text-[#9146ff] font-medium cursor-pointer hover:underline"
          onAuxClick={(e) => {
            if (e.button !== 1) return;
            e.preventDefault();
            openUrl(`https://twitch.tv/${frag.user_login}`);
          }}
          onMouseDown={(e) => {
            if (e.button === 1) e.preventDefault();
          }}
        >
          {frag.text}
        </span>
      );
    default:
      return <TextWithEmotes text={frag.text} emotes={emotes} />;
  }
}

export default function FeedMessage(props: Props) {
  const mentioned = () =>
    props.item.fragments.some(
      (f) => f.type === "mention" && f.user_login === props.userLogin,
    );

  const visibleFragments = () => {
    const item = props.item;
    if (!item.reply) return item.fragments;
    const [first, ...rest] = item.fragments;
    if (
      first?.type === "mention" &&
      first.user_login === item.reply.parent_user_login
    ) {
      if (rest[0]?.type === "text") {
        const trimmed = rest[0].text.trimStart();
        return trimmed
          ? [{ ...rest[0], text: trimmed }, ...rest.slice(1)]
          : rest.slice(1);
      }
      return rest;
    }
    return item.fragments;
  };

  return (
    <div
      data-message-id={props.item.message_id}
      data-item-id={props.item.message_id}
      class={`relative group flex gap-2 leading-[1.6] px-2 py-1 -mx-2 border-l-4 border-transparent rounded-r-md hover:bg-white/6 ${
        mentioned()
          ? "bg-[#9146ff1a] border-[#9146ff]! hover:bg-[#9146ff26]"
          : props.item.channel_points
            ? "bg-[#ff66cc1a] border-[#ff66cc]! hover:bg-[#ff66cc26]"
            : props.item.first_message
              ? "bg-[#3d3d4a40] border-[#6e6e8f]! hover:bg-[#3d3d4a66]"
              : ""
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onContextMenu(e.clientX, e.clientY, props.item);
      }}
    >
      <FeedMessageToolbar
        item={props.item}
        reactions={props.reactions}
        onReact={props.onReact}
        onReply={props.onReply}
        onMore={props.onContextMenu}
      />
      <Show when={props.showTimestamp}>
        <span class="text-[#6e6e8f] select-none tabular-nums shrink-0">
          {props.item.timestamp}
        </span>
      </Show>
      <div class="wrap-break-word min-w-0">
        <Show when={props.item.reply}>
          <div
            class="text-[#6e6e8f] leading-[1.6em] truncate cursor-pointer hover:text-[#adadb8] transition-colors"
            onClick={() => {
              const el = document.querySelector(
                `[data-message-id="${props.item.reply!.parent_message_id}"]`,
              ) as HTMLElement | null;
              if (!el) return;
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.style.backgroundColor = "rgba(145, 70, 255, 0.35)";
              const clear = () => {
                el.style.transition = "background-color 0.3s ease";
                el.style.backgroundColor = "";
                el.removeEventListener("mouseenter", clear);
              };
              el.addEventListener("mouseenter", clear);
            }}
          >
            <span class="text-[0.78em]">⌐ Replying to </span>
            <span class="text-[0.78em] font-semibold text-[#9146ff]">
              @{props.item.reply!.parent_user_name}
            </span>
            <span class="text-[0.78em]">
              : {props.item.reply!.parent_message_body}
            </span>
          </div>
        </Show>
        <Show
          when={props.item.badges.some(
            (b) => props.badgePrefs[badgeCategoryFor(b.set_id)]?.show !== false,
          )}
        >
          <span class="inline-flex items-center gap-1.5 bg-white/8 border border-white/12 rounded-md px-1.5 py-1 mr-1.5 align-text-bottom">
            <For
              each={props.item.badges.filter(
                (b) => props.badgePrefs[badgeCategoryFor(b.set_id)]?.show !== false,
              )}
            >
              {(b) => {
                const badge = props.badges[`${b.set_id}/${b.id}`];
                return badge ? (
                  <img
                    src={badge.url}
                    alt={badge.title}
                    title={`${badge.title}${b.info ? ` (${b.info})` : ""}`}
                    class="w-[0.85em] h-[0.85em]"
                  />
                ) : null;
              }}
            </For>
          </span>
        </Show>
        <span
          class="font-semibold cursor-pointer hover:underline"
          style={{ color: props.item.color || "#9146ff" }}
          onAuxClick={(e) => {
            if (e.button !== 1) return;
            e.preventDefault();
            openUrl(`https://twitch.tv/${props.item.chatter_login}`);
          }}
          onMouseDown={(e) => {
            if (e.button === 1) e.preventDefault();
          }}
        >
          {props.useDisplayName === false ? props.item.chatter_login : props.item.chatter_name}
        </span>
        <span class="text-[#adadb8]">: </span>
        <For each={visibleFragments()}>
          {(frag) => renderFragment(frag, props.emotes)}
        </For>
      </div>
    </div>
  );
}
