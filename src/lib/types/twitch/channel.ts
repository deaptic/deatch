import type { GameRef } from "./game.ts";
import type { UserRef } from "./user.ts";

export type Follow = {
  user: UserRef;
  followedAt: string;
};

export type ChannelInfo = {
  broadcaster: UserRef;
  game: GameRef;
  title: string;
};
