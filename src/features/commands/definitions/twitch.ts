import type {
  AnnouncementColor,
  ChatColor,
} from "../../../shared/types/index.ts";
import {
  banUser,
  deleteChatMessages,
  setSuspiciousStatus,
  unbanUser,
  warnUser,
} from "../../../platform/twitch/moderation.ts";
import { users } from "../../users/index.ts";
import { raid } from "../../activity/index.ts";
import {
  sendChatAnnouncement,
  sendShoutout,
  updateChatSettings,
  updateUserChatColor,
} from "../../../platform/twitch/chat.ts";
import { chat } from "../../chat/index.ts";
import { createStreamMarker } from "../../../platform/twitch/streams.ts";
import { searchCategories } from "../../../platform/twitch/search.ts";
import {
  addChannelModerator,
  addChannelVip,
  modifyChannelInformation,
  removeChannelModerator,
  removeChannelVip,
  startCommercial,
} from "../../../platform/twitch/channels.ts";
import type { Command, OptionSuggestion } from "../types.ts";
import { AD_LENGTHS, ANNOUNCEMENT_COLORS } from "../../../shared/twitch.ts";

export const twitchCommands: Command[] = [
  {
    name: "ban",
    description: "COMMAND_BAN_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_BAN_USERNAME_LABEL",
        type: "user",
        required: true,
      },
      {
        name: "reason",
        description: "COMMAND_BAN_REASON_LABEL",
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
    description: "COMMAND_UNBAN_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_UNBAN_USERNAME_LABEL",
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
    description: "COMMAND_TIMEOUT_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_TIMEOUT_USERNAME_LABEL",
        type: "user",
        required: true,
      },
      {
        name: "duration",
        description: "COMMAND_TIMEOUT_DURATION_LABEL",
        type: "duration",
        required: true,
        min: 1,
        max: 1209600,
        hint: "COMMAND_TIMEOUT_DURATION_HINT",
      },
      {
        name: "reason",
        description: "COMMAND_TIMEOUT_REASON_LABEL",
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
    description: "COMMAND_UNTIMEOUT_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_UNTIMEOUT_USERNAME_LABEL",
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
    description: "COMMAND_CLEAR_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_ANNOUNCE_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "message",
        description: "COMMAND_ANNOUNCE_MESSAGE_LABEL",
        type: "string",
        required: true,
      },
      {
        name: "color",
        description: "COMMAND_ANNOUNCE_COLOR_LABEL",
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
    description: "COMMAND_SLOW_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "duration",
        description: "COMMAND_SLOW_DURATION_LABEL",
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
    description: "COMMAND_SLOWOFF_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_FOLLOWERS_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "duration",
        description: "COMMAND_FOLLOWERS_DURATION_LABEL",
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
    description: "COMMAND_FOLLOWERSOFF_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_EMOTEONLY_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_EMOTEONLYOFF_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_SUBSCRIBERS_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_SUBSCRIBERSOFF_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_UNIQUECHAT_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_UNIQUECHATOFF_DESCRIPTION",
    role: "moderator",
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
    description: "COMMAND_SHOUTOUT_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "channel",
        description: "COMMAND_SHOUTOUT_CHANNEL_LABEL",
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
    name: "mod",
    description: "COMMAND_MOD_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "username",
        description: "COMMAND_MOD_USERNAME_LABEL",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await addChannelModerator({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
      });
    },
  },
  {
    name: "unmod",
    description: "COMMAND_UNMOD_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "username",
        description: "COMMAND_UNMOD_USERNAME_LABEL",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await removeChannelModerator({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
      });
    },
  },
  {
    name: "vip",
    description: "COMMAND_VIP_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "username",
        description: "COMMAND_VIP_USERNAME_LABEL",
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
    description: "COMMAND_UNVIP_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "username",
        description: "COMMAND_UNVIP_USERNAME_LABEL",
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
    description: "COMMAND_RAID_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "channel",
        description: "COMMAND_RAID_CHANNEL_LABEL",
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
    description: "COMMAND_UNRAID_DESCRIPTION",
    role: "broadcaster",
    options: [],
    execute: async (_, ctx) => {
      await raid.cancel(ctx.broadcasterId);
    },
  },
  {
    name: "me",
    description: "COMMAND_ME_DESCRIPTION",
    role: "everyone",
    options: [
      {
        name: "message",
        description: "COMMAND_ME_MESSAGE_LABEL",
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
    name: "monitor",
    description: "COMMAND_MONITOR_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_SUSPICIOUS_USERNAME_LABEL",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await setSuspiciousStatus({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        status: "active_monitoring",
      });
    },
  },
  {
    name: "unmonitor",
    description: "COMMAND_UNMONITOR_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_SUSPICIOUS_USERNAME_LABEL",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await setSuspiciousStatus({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        status: "none",
      });
    },
  },
  {
    name: "restrict",
    description: "COMMAND_RESTRICT_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_SUSPICIOUS_USERNAME_LABEL",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await setSuspiciousStatus({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        status: "restricted",
      });
    },
  },
  {
    name: "unrestrict",
    description: "COMMAND_UNRESTRICT_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_SUSPICIOUS_USERNAME_LABEL",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }, ctx) => {
      await setSuspiciousStatus({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        status: "none",
      });
    },
  },
  {
    name: "warn",
    description: "COMMAND_WARN_DESCRIPTION",
    role: "moderator",
    options: [
      {
        name: "username",
        description: "COMMAND_WARN_USERNAME_LABEL",
        type: "user",
        required: true,
      },
      {
        name: "reason",
        description: "COMMAND_WARN_REASON_LABEL",
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
    description: "COMMAND_MARKER_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "description",
        description: "COMMAND_MARKER_NOTE_LABEL",
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
    description: "COMMAND_COLOR_DESCRIPTION",
    role: "everyone",
    options: [
      {
        name: "color",
        description: "COMMAND_COLOR_COLOR_LABEL",
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
    description: "COMMAND_TITLE_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "title",
        description: "COMMAND_TITLE_TITLE_LABEL",
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
    description: "COMMAND_GAME_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "game",
        description: "COMMAND_GAME_CATEGORY_LABEL",
        type: "search",
        required: true,
        hint: "COMMAND_GAME_CATEGORY_HINT",
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
    description: "COMMAND_COMMERCIAL_DESCRIPTION",
    role: "broadcaster",
    options: [
      {
        name: "length",
        description: "COMMAND_COMMERCIAL_LENGTH_LABEL",
        type: "enum",
        required: true,
        values: AD_LENGTHS.map(String),
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
