import type { UserId } from "./ids.ts";
import type { UserRef } from "./user.ts";

export type Ban = {
  userId: UserId;
  broadcasterId: UserId;
  moderatorId: UserId;
  createdAt: string;
  endTime: string;
};

export type BannedUser = {
  user: UserRef;
  moderator: UserRef;
  reason: string;
  expiresAt: string;
};
