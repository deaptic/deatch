import type { UserId } from "./ids";
import type { UserRef } from "./user";

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
