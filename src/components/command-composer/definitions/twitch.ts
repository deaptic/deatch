import type { AnnouncementColor, ChatColor } from "../../../lib/types/index.ts";
import {
  banUser,
  deleteChatMessages,
  unbanUser,
  warnUser,
} from "../../../lib/api/twitch/moderation.ts";
import * as users from "../../../lib/services/users.ts";
import * as raid from "../../../lib/services/raid.ts";
import {
  sendChatAnnouncement,
  sendShoutout,
  updateChatSettings,
  updateUserChatColor,
} from "../../../lib/api/twitch/chat.ts";
import * as chat from "../../../lib/services/chat.ts";
import { createStreamMarker } from "../../../lib/api/twitch/streams.ts";
import { searchCategories } from "../../../lib/api/twitch/search.ts";
import {
  addChannelVip,
  modifyChannelInformation,
  removeChannelVip,
  startCommercial,
} from "../../../lib/api/twitch/channels.ts";
import type { Command, OptionSuggestion } from "../types.ts";

const ANNOUNCEMENT_COLORS: AnnouncementColor[] = [
  "primary",
  "blue",
  "green",
  "orange",
  "purple",
];

export const twitchCommands: Command[] = [
  {
    name: "ban",
    description: "COMMAND_BAN",
    role: "mod",
    options: [
      {
        name: "username",
        description: "COMMAND_BAN_USERNAME",
        type: "user",
        required: true,
      },
      {
        name: "reason",
        description: "COMMAND_BAN_REASON",
        type: "string",
      },
    ],
    execute: async ({ username, reason }, ctx) => {
      await banUser({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        reason: (reason as string | null) ?? null,
      });
    },
  },
  {
    name: "unban",
    description: "COMMAND_UNBAN",
    role: "mod",
    options: [
      {
        name: "username",
        description: "COMMAND_UNBAN_USERNAME",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await unbanUser({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
      });
    },
  },
  {
    name: "timeout",
    description: "COMMAND_TIMEOUT",
    role: "mod",
    options: [
      {
        name: "username",
        description: "COMMAND_TIMEOUT_USERNAME",
        type: "user",
        required: true,
      },
      {
        name: "duration",
        description: "COMMAND_TIMEOUT_DURATION",
        type: "duration",
        required: true,
        min: 1,
        max: 1209600,
        hint: "COMMAND_TIMEOUT_DURATION_HINT",
      },
      {
        name: "reason",
        description: "COMMAND_TIMEOUT_REASON",
        type: "string",
      },
    ],
    execute: async ({ username, duration, reason }, ctx) => {
      await banUser({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        duration: duration as number,
        reason: (reason as string | null) ?? null,
      });
    },
  },
  {
    name: "untimeout",
    description: "COMMAND_UNTIMEOUT",
    role: "mod",
    options: [
      {
        name: "username",
        description: "COMMAND_UNTIMEOUT_USERNAME",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await unbanUser({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
      });
    },
  },
  {
    name: "clear",
    description: "COMMAND_CLEAR",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await deleteChatMessages({
        broadcasterId: ctx.broadcasterId,
        messageId: null,
      });
    },
  },
  {
    name: "announce",
    description: "COMMAND_ANNOUNCE",
    role: "mod",
    options: [
      {
        name: "message",
        description: "COMMAND_ANNOUNCE_MESSAGE",
        type: "string",
        required: true,
      },
      {
        name: "color",
        description: "COMMAND_ANNOUNCE_COLOR",
        type: "enum",
        values: [...ANNOUNCEMENT_COLORS],
        hint: "COMMAND_ANNOUNCE_COLOR_HINT",
      },
    ],
    execute: async ({ message, color }, ctx) => {
      await sendChatAnnouncement({
        broadcasterId: ctx.broadcasterId,
        message: message as string,
        color: (color as AnnouncementColor | null) ?? undefined,
      });
    },
  },
  {
    name: "slow",
    description: "COMMAND_SLOW",
    role: "mod",
    options: [
      {
        name: "duration",
        description: "COMMAND_SLOW_DURATION",
        type: "duration",
        min: 3,
        max: 120,
        hint: "COMMAND_SLOW_DURATION_HINT",
      },
    ],
    execute: async ({ duration }, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        slowMode: true,
        slowModeWaitTime: (duration as number | null) ?? 30,
      });
    },
  },
  {
    name: "slowoff",
    description: "COMMAND_SLOWOFF",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        slowMode: false,
      });
    },
  },
  {
    name: "followers",
    description: "COMMAND_FOLLOWERS",
    role: "mod",
    options: [
      {
        name: "duration",
        description: "COMMAND_FOLLOWERS_DURATION",
        type: "duration",
        min: 60,
        max: 7776000,
        hint: "COMMAND_FOLLOWERS_DURATION_HINT",
      },
    ],
    execute: async ({ duration }, ctx) => {
      const seconds = (duration as number | null) ?? 0;
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        followerMode: true,
        followerModeDuration: Math.floor(seconds / 60),
      });
    },
  },
  {
    name: "followersoff",
    description: "COMMAND_FOLLOWERSOFF",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        followerMode: false,
      });
    },
  },
  {
    name: "emoteonly",
    description: "COMMAND_EMOTEONLY",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        emoteMode: true,
      });
    },
  },
  {
    name: "emoteonlyoff",
    description: "COMMAND_EMOTEONLYOFF",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        emoteMode: false,
      });
    },
  },
  {
    name: "subscribers",
    description: "COMMAND_SUBSCRIBERS",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        subscriberMode: true,
      });
    },
  },
  {
    name: "subscribersoff",
    description: "COMMAND_SUBSCRIBERSOFF",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        subscriberMode: false,
      });
    },
  },
  {
    name: "uniquechat",
    description: "COMMAND_UNIQUECHAT",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        uniqueChatMode: true,
      });
    },
  },
  {
    name: "uniquechatoff",
    description: "COMMAND_UNIQUECHATOFF",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({
        broadcasterId: ctx.broadcasterId,
        uniqueChatMode: false,
      });
    },
  },
  {
    name: "shoutout",
    aliases: ["so"],
    description: "COMMAND_SHOUTOUT",
    role: "mod",
    options: [
      {
        name: "channel",
        description: "COMMAND_SHOUTOUT_CHANNEL",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ channel }, ctx) => {
      await sendShoutout({
        fromBroadcasterId: ctx.broadcasterId,
        toBroadcasterId: channel as string,
      });
    },
  },
  {
    name: "vip",
    description: "COMMAND_VIP",
    role: "broadcaster",
    options: [
      {
        name: "username",
        description: "COMMAND_VIP_USERNAME",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await addChannelVip({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
      });
    },
  },
  {
    name: "unvip",
    description: "COMMAND_UNVIP",
    role: "broadcaster",
    options: [
      {
        name: "username",
        description: "COMMAND_UNVIP_USERNAME",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await removeChannelVip({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
      });
    },
  },
  {
    name: "raid",
    description: "COMMAND_RAID",
    role: "broadcaster",
    options: [
      {
        name: "channel",
        description: "COMMAND_RAID_CHANNEL",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ channel }, ctx) => {
      const id = channel as string;
      const [user] = await users.get([id]).catch(() => []);
      await raid.begin(ctx.broadcasterId, {
        id,
        login: user?.login ?? "",
        displayName: user?.displayName ?? id,
      });
    },
  },
  {
    name: "unraid",
    description: "COMMAND_UNRAID",
    role: "broadcaster",
    options: [],
    execute: async (_, ctx) => {
      await raid.cancel(ctx.broadcasterId);
    },
  },
  {
    name: "me",
    description: "COMMAND_ME",
    role: "regular",
    options: [
      {
        name: "message",
        description: "COMMAND_ME_MESSAGE",
        type: "string",
        required: true,
      },
    ],
    execute: async ({ message }, ctx) => {
      await chat.send({
        broadcasterId: ctx.broadcasterId,
        message: `/me ${message as string}`,
      });
    },
  },
  {
    name: "warn",
    description: "COMMAND_WARN",
    role: "mod",
    options: [
      {
        name: "username",
        description: "COMMAND_WARN_USERNAME",
        type: "user",
        required: true,
      },
      {
        name: "reason",
        description: "COMMAND_WARN_REASON",
        type: "string",
        required: true,
      },
    ],
    execute: async ({ username, reason }, ctx) => {
      await warnUser({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        reason: reason as string,
      });
    },
  },
  {
    name: "marker",
    description: "COMMAND_MARKER",
    role: "broadcaster",
    options: [
      {
        name: "description",
        description: "COMMAND_MARKER_DESCRIPTION",
        type: "string",
      },
    ],
    execute: async ({ description }) => {
      await createStreamMarker({
        description: (description as string | null) ?? undefined,
      });
    },
  },
  {
    name: "color",
    description: "COMMAND_COLOR",
    role: "regular",
    options: [
      {
        name: "color",
        description: "COMMAND_COLOR_COLOR",
        type: "enum",
        required: true,
        values: [
          "blue",
          "blue_violet",
          "cadet_blue",
          "chocolate",
          "coral",
          "dodger_blue",
          "firebrick",
          "golden_rod",
          "green",
          "hot_pink",
          "orange_red",
          "red",
          "sea_green",
          "spring_green",
          "yellow_green",
        ],
      },
    ],
    execute: async ({ color }) => {
      await updateUserChatColor({ color: color as ChatColor });
    },
  },
  {
    name: "title",
    description: "COMMAND_TITLE",
    role: "broadcaster",
    options: [
      {
        name: "title",
        description: "COMMAND_TITLE_TITLE",
        type: "string",
        required: true,
      },
    ],
    execute: async ({ title }, ctx) => {
      await modifyChannelInformation({
        broadcasterId: ctx.broadcasterId,
        title: title as string,
      });
    },
  },
  {
    name: "game",
    aliases: ["category"],
    description: "COMMAND_GAME",
    role: "broadcaster",
    options: [
      {
        name: "game",
        description: "COMMAND_GAME_GAME",
        type: "search",
        required: true,
        hint: "COMMAND_GAME_GAME_HINT",
        search: async (query) => {
          const results = await searchCategories(
            { query, first: 8 },
            { silent: true },
          );
          return results.map((c) => ({
            id: c.id,
            label: c.name,
            image: c.boxArtUrl,
          }));
        },
      },
    ],
    execute: async ({ game }, ctx) => {
      const match = game as OptionSuggestion;
      await modifyChannelInformation({
        broadcasterId: ctx.broadcasterId,
        gameId: match.id,
      });
    },
  },
  {
    name: "commercial",
    description: "COMMAND_COMMERCIAL",
    role: "broadcaster",
    options: [
      {
        name: "length",
        description: "COMMAND_COMMERCIAL_LENGTH",
        type: "enum",
        required: true,
        values: ["30", "60", "90", "120", "150", "180"],
      },
    ],
    execute: async ({ length }, ctx) => {
      await startCommercial({
        broadcasterId: ctx.broadcasterId,
        length: Number(length),
      });
    },
  },
];
