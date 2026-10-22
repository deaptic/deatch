// Pure: how a gift notice belongs to a community gift, so its subs can join
// one row instead of one row each.

import type {
  FeedEvent,
  GiftRecipient,
  RawNotification,
} from "../types/index.ts";
import { detail } from "./notice-message.ts";

export type GiftGroup =
  | { role: "community"; giftId: string }
  | { role: "member"; giftId: string; recipient: GiftRecipient };

export function giftGroup(raw: RawNotification): GiftGroup | null {
  const community = detail(raw, "community_sub_gift");
  if (community?.id) return { role: "community", giftId: community.id };
  const gift = detail(raw, "sub_gift");
  if (gift?.community_gift_id) {
    return {
      role: "member",
      giftId: gift.community_gift_id,
      recipient: {
        id: gift.recipient_user_id ?? undefined,
        login: gift.recipient_user_login,
        name: gift.recipient_user_name,
      },
    };
  }
  return null;
}

export type MappedNotice = { raw: RawNotification; item: FeedEvent };

/// For a batch already in hand, like history: each sub of a community gift
/// in the batch joins that gift's row as a recipient instead of its own row.
export function groupGifts(notices: MappedNotice[]): FeedEvent[] {
  const groups = notices.map(({ raw }) => giftGroup(raw));
  const recipients = new Map<string, GiftRecipient[]>();
  for (const group of groups) {
    if (group?.role === "community") recipients.set(group.giftId, []);
  }
  for (const group of groups) {
    if (group?.role === "member") {
      recipients.get(group.giftId)?.push(group.recipient);
    }
  }
  return notices.flatMap(({ item }, i) => {
    const group = groups[i];
    if (group?.role === "member" && recipients.has(group.giftId)) return [];
    const names = group?.role === "community"
      ? recipients.get(group.giftId)
      : undefined;
    return [names?.length ? { ...item, recipients: names } : item];
  });
}
