import { Show } from "solid-js";
import type { FeedEvent as Event } from "./types";

const SUB = "var(--color-event-sub)";
const RAID = "var(--color-event-raid)";
const ANNOUNCE = "var(--color-event-announce)";

const COLORS: Record<string, string> = {
  sub: SUB,
  resub: SUB,
  sub_gift: SUB,
  community_sub_gift: SUB,
  gift_paid_upgrade: SUB,
  pay_it_forward: SUB,
  prime_paid_upgrade: SUB,
  shared_chat_sub: SUB,
  shared_chat_resub: SUB,
  shared_chat_sub_gift: SUB,
  shared_chat_community_sub_gift: SUB,
  shared_chat_gift_paid_upgrade: SUB,
  shared_chat_pay_it_forward: SUB,
  shared_chat_prime_paid_upgrade: SUB,
  raid: RAID,
  unraid: RAID,
  shared_chat_raid: RAID,
  announcement: ANNOUNCE,
  shared_chat_announcement: ANNOUNCE,
  charity_donation: "var(--color-event-charity)",
  shoutout: "var(--color-event-shoutout)",
  follow: "var(--color-event-follow)",
  bits_badge_tier: "var(--color-event-bits)",
};

type Props = {
  item: Event;
  showTimestamp?: boolean;
  onContextMenu: (x: number, y: number, item: Event) => void;
};

export default function FeedEvent(props: Props) {
  const color = () => COLORS[props.item.notice_type] ?? SUB;
  return (
    <div
      data-item-id={props.item.id}
      class="flex gap-2 items-stretch leading-[1.6] px-2 py-1 -mx-2 bg-bg border-l-4 rounded-r-md"
      style={{ "border-left-color": color() }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onContextMenu(e.clientX, e.clientY, props.item);
      }}
    >
      <Show when={props.showTimestamp}>
        <span class="text-text-muted select-none tabular-nums shrink-0">
          {new Date(props.item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </Show>
      <span class="text-text font-semibold wrap-break-word min-w-0">
        {props.item.system_message}
      </span>
    </div>
  );
}
