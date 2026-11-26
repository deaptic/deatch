import { asRecord, dig, type Loose } from "../../shared/record.ts";

type Earned = { channelID: string; at: string };

export function readWatchEarned(message: Loose): Earned | null {
  const data = asRecord(message.data);
  const { channel_id: channelID, timestamp: at } = data;
  if (dig(data, "point_gain", "reason_code") !== "WATCH") return null;
  if (typeof channelID !== "string" || typeof at !== "string") return null;
  return { channelID, at };
}
