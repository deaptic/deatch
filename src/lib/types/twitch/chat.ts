import type { UserId } from "./ids.ts";

export type Emote = {
  id: string;
  name: string;
  url: string;
};

export type UserEmote = {
  id: string;
  name: string;
  url: string;
  emoteType: string;
  emoteSetId: string;
  ownerId: UserId;
};

export type Badge = {
  id: string;
  url1x: string;
  url2x: string;
  url4x: string;
  title: string;
  description: string;
};

export type BadgeSet = {
  setId: string;
  versions: Badge[];
};

export type SendMessageResult = {
  messageId: string | null;
  isSent: boolean;
  dropReason: string | null;
};
