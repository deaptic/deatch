import { Show } from "solid-js";
import { openNotifContextMenu } from "../chat-state";

export type ChatNotice = {
  kind: "notice";
  notice_type: string;
  system_message: string;
  chatter_user_id?: string;
  chatter_name: string;
  color: string;
  timestamp: string;
};

const DEFAULT_COLOR = "#9146ff";

const SUB_COLOR = "#9146ff";
const RAID_COLOR = "#ff9900";
const ANNOUNCE_COLOR = "#00c8af";

const NOTICE_COLORS: Record<string, string> = {
  // Sub family
  sub: SUB_COLOR,
  resub: SUB_COLOR,
  sub_gift: SUB_COLOR,
  community_sub_gift: SUB_COLOR,
  gift_paid_upgrade: SUB_COLOR,
  pay_it_forward: SUB_COLOR,
  prime_paid_upgrade: SUB_COLOR,
  shared_chat_sub: SUB_COLOR,
  shared_chat_resub: SUB_COLOR,
  shared_chat_sub_gift: SUB_COLOR,
  shared_chat_community_sub_gift: SUB_COLOR,
  shared_chat_gift_paid_upgrade: SUB_COLOR,
  shared_chat_pay_it_forward: SUB_COLOR,
  shared_chat_prime_paid_upgrade: SUB_COLOR,
  // Raid family
  raid: RAID_COLOR,
  unraid: RAID_COLOR,
  shared_chat_raid: RAID_COLOR,
  // Announcement family
  announcement: ANNOUNCE_COLOR,
  shared_chat_announcement: ANNOUNCE_COLOR,
  // Single types
  charity_donation: "#e91916",
  shoutout: "#00b5ff",
  follow: "#00ff7f",
  bits_badge_tier: "#ffd700",
};

export default function ChatNotification(props: { item: ChatNotice; showTimestamp?: boolean }) {
  const color = () => NOTICE_COLORS[props.item.notice_type] ?? DEFAULT_COLOR;
  return (
    <div
      class="flex gap-2 items-stretch leading-[1.6] px-2 py-1 -mx-2 bg-[#1f1f23] border-l-4 rounded-r-md"
      style={{ "border-left-color": color() }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openNotifContextMenu(e.clientX, e.clientY, props.item);
      }}
    >
      <Show when={props.showTimestamp}>
        <span class="text-[#6e6e8f] select-none tabular-nums shrink-0">
          {props.item.timestamp}
        </span>
      </Show>
      <span class="text-white font-semibold wrap-break-word min-w-0">
        {props.item.system_message}
      </span>
    </div>
  );
}
