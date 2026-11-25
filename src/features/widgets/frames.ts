import type { User } from "../../shared/types/index.ts";
import type { CheermoteMap, EmoteMap } from "../emotes/index.ts";
import type { BadgeMap, FeedMessage } from "../feed/index.ts";
import type { ChatStyle } from "../preferences/index.ts";

export type Frame =
  | { topic: "style"; style: ChatStyle }
  | {
      topic: "assets";
      emotes: EmoteMap;
      cheermotes: CheermoteMap;
      badges: BadgeMap;
    }
  | { topic: "entries"; entries: FeedMessage[]; users: User[] };
