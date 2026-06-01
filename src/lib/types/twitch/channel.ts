import type { UserRef } from "./user";

export type Follow = {
  user: UserRef;
  followedAt: string;
};
