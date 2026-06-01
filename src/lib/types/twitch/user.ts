import type { UserId } from "./ids";

export type BroadcasterType = "" | "affiliate" | "partner";

export type UserRef = {
  id: UserId;
  login: string;
  displayName: string;
};

export type User = {
  id: UserId;
  login: string;
  displayName: string;
  description: string;
  profileImageUrl: string;
  broadcasterType: BroadcasterType;
  createdAt: string;
};
