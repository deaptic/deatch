// Pure: how a gift notice belongs to a community gift, so its subs can join
// one row instead of one row each.

import type { RawNotification } from "../types/index.ts";
import { detail } from "./notice-message.ts";

export type GiftGroup =
  | { role: "community"; giftId: string }
  | { role: "member"; giftId: string; recipient: string };

export function giftGroup(raw: RawNotification): GiftGroup | null {
  const community = detail(raw, "community_sub_gift");
  if (community?.id) return { role: "community", giftId: community.id };
  const gift = detail(raw, "sub_gift");
  if (gift?.community_gift_id) {
    return {
      role: "member",
      giftId: gift.community_gift_id,
      recipient: gift.recipient_user_name,
    };
  }
  return null;
}
