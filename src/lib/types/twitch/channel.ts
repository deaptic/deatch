import type { UserRef } from "./user.ts";

export type Follow = {
  user: UserRef;
  followedAt: string;
};
