import type { MessageKey } from "../../shared/i18n/index.ts";
import type { Stream } from "../../shared/types/index.ts";
import type { RawNotification } from "../../platform/twitch/eventsubPayloads.ts";

export const LIVE_FRESH_MS = 10 * 60_000;

export function newlyLive(
  streams: readonly Stream[],
  watched: ReadonlySet<string>,
  seen: ReadonlySet<string>,
  now: number,
): Stream[] {
  return streams.filter(
    (s) =>
      watched.has(s.user.id) &&
      !seen.has(s.id) &&
      now - Date.parse(s.startedAt) < LIVE_FRESH_MS,
  );
}

export type SupportAlert = {
  key: MessageKey;
  name: string | null;
  values: Record<string, string | number>;
};

export function supportAlert(raw: RawNotification): SupportAlert | null {
  const name = raw.chatter_user_name ?? null;
  switch (raw.notice_type) {
    case "sub":
      return { key: "ALERTS_SUB_TOAST", name, values: {} };
    case "resub":
      return { key: "ALERTS_RESUB_TOAST", name, values: {} };
    case "sub_gift":
      return raw.sub_gift && !raw.sub_gift.community_gift_id
        ? {
            key: "ALERTS_GIFT_TOAST",
            name,
            values: { recipient: raw.sub_gift.recipient_user_name },
          }
        : null;
    case "community_sub_gift":
      return raw.community_sub_gift
        ? {
            key: "ALERTS_COMMUNITY_GIFT_TOAST",
            name,
            values: { count: raw.community_sub_gift.total },
          }
        : null;
    default:
      return null;
  }
}
