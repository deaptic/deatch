import type { GameRef } from "./game";
import type { StreamId } from "./ids";
import type { UserRef } from "./user";

export type Thumbnail = {
  small: string;
  medium: string;
  large: string;
};

export type Stream = {
  id: StreamId;
  user: UserRef;
  game: GameRef;
  title: string;
  viewerCount: number;
  startedAt: string;
  language: string;
  thumbnail: Thumbnail;
  tags: string[];
  isMature: boolean;
};
