import { expect, test } from "vite-plus/test";
import { readProgressEvent, readReward, readSession } from "./progress.ts";

const session = (change: object) => ({
  currentUser: {
    dropCurrentSession: {
      game: { displayName: "Old School RuneScape" },
      currentMinutesWatched: 16,
      requiredMinutesWatched: 60,
      dropID: "drop1",
      ...change,
    },
  },
});

test("a running drop session reports its drop, game and minutes", () => {
  expect(readSession(session({}))).toEqual({
    dropID: "drop1",
    game: "Old School RuneScape",
    watched: 16,
    required: 60,
  });
});

test("no session, or one without a goal, reports nothing", () => {
  expect(readSession({ currentUser: { dropCurrentSession: null } })).toBeNull();
  expect(readSession(session({ requiredMinutesWatched: 0 }))).toBeNull();
  expect(readSession(session({ currentMinutesWatched: -1 }))).toBeNull();
  expect(readSession(null)).toBeNull();
});

const inventory = {
  currentUser: {
    inventory: {
      dropCampaignsInProgress: [
        {
          timeBasedDrops: [
            {
              id: "drop1",
              name: "Watch 1 hour",
              benefitEdges: [
                {
                  benefit: {
                    name: "Gnome Child Cape",
                    imageAssetURL: "https://example.com/cape.png",
                  },
                },
              ],
            },
            { id: "drop2", name: "Watch 2 hours", benefitEdges: [] },
          ],
        },
      ],
    },
  },
};

test("the drop's reward name and picture come from the inventory", () => {
  expect(readReward(inventory, "drop1")).toEqual({
    reward: "Gnome Child Cape",
    image: "https://example.com/cape.png",
  });
  expect(readReward(inventory, "drop2")).toEqual({
    reward: "Watch 2 hours",
    image: null,
  });
  expect(readReward(inventory, "missing")).toEqual({
    reward: null,
    image: null,
  });
});

test("Twitch's drop-progress message gives the channel and minutes", () => {
  const message = {
    type: "drop-progress",
    data: {
      drop_id: "0cc61e0f",
      channel_id: "24138907",
      current_progress_min: 21,
      required_progress_min: 60,
    },
  };
  expect(readProgressEvent(message)).toEqual({
    channelID: "24138907",
    dropID: "0cc61e0f",
    watched: 21,
    required: 60,
  });
  expect(readProgressEvent({ type: "drop-progress", data: {} })).toBeNull();
});
