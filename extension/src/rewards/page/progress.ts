import { log } from "../../shared/log.ts";
import {
  asRecord,
  asList,
  dig,
  type Loose,
  stringOrNull,
  wholeNumber,
} from "../../shared/record.ts";
import type { DropProgress } from "../types.ts";
import type { Finder } from "./finder.ts";
import { query } from "./graphql.ts";

const sessionQuery = (channelID: string) =>
  query("DropSession", {
    currentUser: {
      id: true,
      dropCurrentSession: {
        args: { channelID },
        select: {
          game: { id: true, displayName: true },
          currentMinutesWatched: true,
          requiredMinutesWatched: true,
          dropID: true,
        },
      },
    },
  });

const DROP_DETAILS = query("DropDetails", {
  currentUser: {
    id: true,
    inventory: {
      dropCampaignsInProgress: {
        id: true,
        timeBasedDrops: {
          id: true,
          name: true,
          benefitEdges: {
            benefit: { id: true, name: true, imageAssetURL: true },
          },
        },
      },
    },
  },
});

export type Session = {
  dropID: string | null;
  game: string;
  watched: number;
  required: number;
};
type DropReward = Pick<DropProgress, "reward" | "image">;

const NO_REWARD: DropReward = { reward: null, image: null };

export function readSession(data: unknown): Session | null {
  const session = asRecord(dig(data, "currentUser", "dropCurrentSession"));
  const game = dig(session, "game", "displayName");
  const watched = wholeNumber(session.currentMinutesWatched);
  const required = wholeNumber(session.requiredMinutesWatched);
  if (typeof game !== "string" || watched === null || !required) return null;
  return { dropID: stringOrNull(session.dropID), game, watched, required };
}

export function readReward(data: unknown, dropID: string): DropReward {
  const campaigns = asList(
    dig(data, "currentUser", "inventory", "dropCampaignsInProgress"),
  );
  const drop = campaigns
    .flatMap((campaign) => asList(asRecord(campaign).timeBasedDrops))
    .map(asRecord)
    .find((candidate) => candidate.id === dropID);
  if (!drop) return NO_REWARD;
  const benefit = asRecord(asRecord(asList(drop.benefitEdges)[0]).benefit);
  return {
    reward: stringOrNull(benefit.name) ?? stringOrNull(drop.name),
    image: stringOrNull(benefit.imageAssetURL),
  };
}

type Minutes = {
  channelID: string;
  dropID: string | null;
  watched: number;
  required: number;
};

export function readProgressEvent(message: Loose): Minutes | null {
  const data = asRecord(message.data);
  const channelID = data.channel_id;
  const watched = wholeNumber(data.current_progress_min);
  const required = wholeNumber(data.required_progress_min);
  if (typeof channelID !== "string" || watched === null || !required) {
    return null;
  }
  return { channelID, dropID: stringOrNull(data.drop_id), watched, required };
}

export function createProgress(finder: Finder, onChange: () => void) {
  let progress: DropProgress | null = null;
  let channel: string | null = null;
  let currentDrop: string | null = null;
  const rewards = new Map<string, DropReward>();

  function set(next: DropProgress | null) {
    if (JSON.stringify(next) === JSON.stringify(progress)) return;
    progress = next;
    onChange();
  }

  async function rewardOf(dropID: string | null): Promise<DropReward> {
    const client = finder.client();
    if (!dropID || !client) return NO_REWARD;
    const known = rewards.get(dropID);
    if (known) return known;
    const result = await client.query({
      query: DROP_DETAILS,
      fetchPolicy: "network-only",
    });
    const reward = readReward(result.data, dropID);
    rewards.set(dropID, reward);
    return reward;
  }

  async function refresh(channelID: string) {
    const client = finder.client();
    if (!client) return;
    if (channel !== channelID) set(null);
    channel = channelID;
    try {
      const result = await client.query({
        query: sessionQuery(channelID),
        fetchPolicy: "network-only",
      });
      const session = readSession(result.data);
      if (!session) {
        if (channel === channelID) set(null);
        return;
      }
      const { dropID, ...minutes } = session;
      currentDrop = dropID;
      const reward = await rewardOf(dropID).catch((error: unknown) => {
        log.warn("drop reward not read", dropID, error);
        return NO_REWARD;
      });
      if (channel === channelID) set({ ...minutes, ...reward });
    } catch (error) {
      log.warn("drop progress not read", channelID, error);
    }
  }

  function advance({ channelID, dropID, watched, required }: Minutes) {
    if (channel !== channelID) return;
    const sameDrop = dropID === null || dropID === currentDrop;
    if (progress && sameDrop) set({ ...progress, watched, required });
    else void refresh(channelID);
  }

  return { current: () => progress, refresh, advance };
}
