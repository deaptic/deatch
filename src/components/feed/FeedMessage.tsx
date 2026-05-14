import { For, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import { EmoteMap } from "../../state/emotes";
import { badgeCategoryFor, type BadgeCategoryKey } from "../../constants";
import FeedMessageToolbar from "./FeedMessageToolbar";
import FeedMessageFragment from "./FeedMessageFragment";
import type { FeedMessage as Message, BadgeMap } from "../../types";
import { matchesAnyKeyword, feedUserNickname } from "../../state/preferences";

type Reaction = { label: string; value: string; url: string };

type Props = {
  item: Message;
  emotes: EmoteMap;
  badges: BadgeMap;
  badgePrefs: Record<BadgeCategoryKey, { show: boolean }>;
  userLogin: string;
  keywords?: string[];
  useDisplayName?: boolean;
  showTimestamp?: boolean;
  showDeletedContent?: boolean;
  overrideNameColor?: string;
  reactions: Reaction[];
  onContextMenu: (x: number, y: number, msg: Message) => void;
  onReply: (msg: Message) => void;
  onReact: (msg: Message, value: string) => void;
  onCopypasta: (msg: Message) => void;
  onJumpToMessage: (messageId: string) => void;
  onShowUserCard?: (x: number, y: number, identity: { userId?: string; login?: string }) => void;
  onUserContextMenu?: (x: number, y: number, identity: { userId?: string; login?: string; displayName?: string }) => void;
};

export default function FeedMessage(props: Props) {
  const mentioned = () => {
    if (props.item.fragments.some((f) => f.type === "mention" && f.user_login === props.userLogin)) {
      return true;
    }
    const kws = props.keywords;
    if (!kws || kws.length === 0) return false;
    const text = props.item.fragments.map((f) => f.text).join(" ");
    return matchesAnyKeyword(text, kws);
  };

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
      class={`relative group flex gap-2 leading-[1.6] pl-2 pr-3 py-1 -mx-2 border-l-4 border-transparent rounded-r-md hover:bg-white/6 ${
        props.item.deleted ? "opacity-50 " : ""
      }${
        mentioned()
          ? "bg-primary/10 border-primary! hover:bg-primary/15"
          : props.item.channel_points
            ? "bg-event-channel-points/10 border-event-channel-points! hover:bg-event-channel-points/15"
            : props.item.first_message
              ? "bg-border/25 border-highlight! hover:bg-border/40"
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
        onCopypasta={props.onCopypasta}
        onMore={props.onContextMenu}
      />
      <Show when={props.showTimestamp}>
        <span class="text-text-muted select-none tabular-nums shrink-0">
          {new Date(props.item.timestamp).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      </Show>
      <div class="wrap-break-word min-w-0">
        <Show when={props.item.reply}>
          <div
            class="text-text-muted/70 leading-[1.6em] truncate cursor-pointer hover:text-text-muted transition-colors"
            onClick={() =>
              props.onJumpToMessage(props.item.reply!.parent_message_id)
            }
          >
            <span class="text-[0.78em]">⌐ Replying to </span>
            <span class="text-[0.78em] font-semibold text-primary">
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
                (b) =>
                  props.badgePrefs[badgeCategoryFor(b.set_id)]?.show !== false,
              )}
            >
              {(b) => {
                const badge = () => props.badges[`${b.set_id}/${b.id}`];
                return (
                  <Show when={badge()}>
                    <img
                      src={badge()!.url}
                      alt={badge()!.title}
                      title={`${badge()!.title}${b.info ? ` (${b.info})` : ""}`}
                      class="w-[0.85em] h-[0.85em]"
                    />
                  </Show>
                );
              }}
            </For>
          </span>
        </Show>
        <span
          class="font-semibold cursor-pointer hover:underline"
          style={{
            color:
              props.overrideNameColor ||
              (props.item.color
                ? `oklch(from ${props.item.color} max(l, 0.65) c h)`
                : "var(--color-primary)"),
          }}
          onClick={(e) => props.onShowUserCard?.(e.clientX, e.clientY, { userId: props.item.chatter_user_id })}
          onContextMenu={(e) => {
            if (!props.onUserContextMenu) return;
            e.preventDefault();
            e.stopPropagation();
            props.onUserContextMenu(e.clientX, e.clientY, {
              userId: props.item.chatter_user_id,
              login: props.item.chatter_login,
              displayName: props.item.chatter_name,
            });
          }}
          onAuxClick={(e) => {
            if (e.button !== 1) return;
            e.preventDefault();
            openUrl(`https://twitch.tv/${props.item.chatter_login}`);
          }}
          onMouseDown={(e) => {
            if (e.button === 1) e.preventDefault();
          }}
        >
          {feedUserNickname(props.item.chatter_login) ??
            (props.useDisplayName === false
              ? props.item.chatter_login
              : props.item.chatter_name)}
        </span>
        <span class="text-text-muted">: </span>
        <Show
          when={!props.item.deleted || props.showDeletedContent}
          fallback={<span class="italic text-text-muted">&lt;deleted&gt;</span>}
        >
          <For each={visibleFragments()}>
            {(frag) => (
              <FeedMessageFragment
                frag={frag}
                emotes={props.emotes}
                onShowUserCard={props.onShowUserCard}
                onUserContextMenu={props.onUserContextMenu}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
