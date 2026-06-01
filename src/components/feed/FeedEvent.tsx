import { ExternalLink } from "lucide-solid";
import { Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { FeedEvent as Event } from "../../lib/types/index.ts";
import Timestamp from "../ui/Timestamp.tsx";
import RichNotice from "./RichNotice.tsx";

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
  channel_points_redemption: "var(--color-event-channel-points)",
  clip_created: "var(--color-primary)",
};

type Props = {
  item: Event;
  showTimestamp?: boolean;
  onContextMenu?: (x: number, y: number, item: Event) => void;
};

export default function FeedEvent(props: Props) {
  const color = () => COLORS[props.item.notice_type] ?? SUB;
  return (
    <div
      data-item-id={props.item.id}
      class="relative group flex gap-2 items-stretch leading-[1.6] px-2 py-1 -mx-2 border-l-4 rounded-r-md"
      style={{
        "background-color": `color-mix(in oklab, ${color()} 10%, transparent)`,
        "border-left-color": color(),
      }}
      onContextMenu={(e) => {
        if (!props.onContextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        props.onContextMenu(e.clientX, e.clientY, props.item);
      }}
    >
      <Show when={props.showTimestamp}>
        <Timestamp
          ts={props.item.timestamp}
          class="text-text-muted select-none shrink-0"
        />
      </Show>
      <Show
        when={props.item.clip}
        fallback={
          <span class="text-text font-semibold wrap-break-word min-w-0">
            {props.item.system_message}
          </span>
        }
      >
        <RichNotice
          class="text-text font-semibold wrap-break-word min-w-0"
          label={props.item.system_message}
          actions={[
            {
              title: "View clip",
              icon: () => <ExternalLink class="size-3.5" />,
              variant: "success",
              onClick: () =>
                openUrl(`https://clips.twitch.tv/${props.item.clip!.id}`),
            },
          ]}
        />
      </Show>
    </div>
  );
}
