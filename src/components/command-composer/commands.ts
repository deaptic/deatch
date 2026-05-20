import {
  banUser,
  unbanUser,
  deleteChatMessages,
  addChannelVip,
  removeChannelVip,
  startRaid,
  cancelRaid,
  warnUser,
} from "../../commands/moderation";
import {
  sendShoutout,
  sendChatAnnouncement,
  sendChatMessage,
  updateChatSettings,
  updateUserChatColor,
  type AnnouncementColor,
  type NamedUserColor,
} from "../../commands/chat";
import {
  createStreamMarker,
  getStreams,
} from "../../commands/streams";
import {
  modifyChannelInformation,
  startCommercial,
  getFollowedChannels,
  type CommercialLength,
} from "../../commands/channels";
import {
  user,
  userCache,
  chattersByChannel,
} from "../../state/users";
import {
  setUserNickname,
  removeUserNickname,
  muteUser,
  unmuteUser,
} from "../../state/preferences";
import { appendLocalNotice } from "../../state/feeds";
import type { Command } from "./types";

function loginFromUserId(userId: string): string | null {
  const cached = userCache()[userId];
  if (cached) return cached.login;
  for (const bucket of chattersByChannel.values()) {
    const c = bucket.get(userId);
    if (c) return c.login;
  }
  return null;
}

function formatUptime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const ANNOUNCEMENT_COLORS: AnnouncementColor[] = ["primary", "blue", "green", "orange", "purple"];

const twitchCommands: Command[] = [
  {
    name: "ban",
    description: "Permanently ban a user from chat",
    role: "mod",
    options: [
      { name: "username", description: "User to ban", type: "user", required: true },
      { name: "reason", description: "Reason shown to the user", type: "string" },
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
    description: "Lift a user's ban",
    role: "mod",
    options: [
      { name: "username", description: "User to unban", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      await unbanUser({ broadcasterId: ctx.broadcasterId, userId: username as string });
    },
  },
  {
    name: "timeout",
    description: "Temporarily ban a user from chat",
    role: "mod",
    options: [
      { name: "username", description: "User to time out", type: "user", required: true },
      {
        name: "duration",
        description: "Length of the timeout",
        type: "duration",
        required: true,
        hint: "e.g. 30s, 5m, 1h, 1d",
      },
      { name: "reason", description: "Reason shown to the user", type: "string" },
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
    description: "Lift a user's timeout",
    role: "mod",
    options: [
      { name: "username", description: "User to untimeout", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      await unbanUser({ broadcasterId: ctx.broadcasterId, userId: username as string });
    },
  },
  {
    name: "clear",
    description: "Delete all messages in chat",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await deleteChatMessages({ broadcasterId: ctx.broadcasterId, messageId: null });
    },
  },
  {
    name: "announce",
    description: "Send a highlighted announcement to chat",
    role: "mod",
    options: [
      { name: "message", description: "Announcement text", type: "string", required: true },
      {
        name: "color",
        description: "Highlight color",
        type: "enum",
        values: [...ANNOUNCEMENT_COLORS],
        hint: "primary, blue, green, orange, purple",
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
    description: "Enable slow mode",
    role: "mod",
    options: [
      {
        name: "duration",
        description: "Wait time between messages",
        type: "duration",
        hint: "3s–120s, default 30s",
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
    description: "Disable slow mode",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({ broadcasterId: ctx.broadcasterId, slowMode: false });
    },
  },
  {
    name: "followers",
    description: "Restrict chat to followers only",
    role: "mod",
    options: [
      {
        name: "duration",
        description: "Minimum follow age to chat",
        type: "duration",
        hint: "e.g. 10m, 1h, 1d (max 3 months)",
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
    description: "Disable followers-only mode",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({ broadcasterId: ctx.broadcasterId, followerMode: false });
    },
  },
  {
    name: "emoteonly",
    description: "Restrict chat to emotes only",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({ broadcasterId: ctx.broadcasterId, emoteMode: true });
    },
  },
  {
    name: "emoteonlyoff",
    description: "Disable emote-only mode",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({ broadcasterId: ctx.broadcasterId, emoteMode: false });
    },
  },
  {
    name: "subscribers",
    description: "Restrict chat to subscribers only",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({ broadcasterId: ctx.broadcasterId, subscriberMode: true });
    },
  },
  {
    name: "subscribersoff",
    description: "Disable subscriber-only mode",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({ broadcasterId: ctx.broadcasterId, subscriberMode: false });
    },
  },
  {
    name: "uniquechat",
    description: "Require each message to be unique",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({ broadcasterId: ctx.broadcasterId, uniqueChatMode: true });
    },
  },
  {
    name: "uniquechatoff",
    description: "Disable unique-chat mode",
    role: "mod",
    options: [],
    execute: async (_, ctx) => {
      await updateChatSettings({ broadcasterId: ctx.broadcasterId, uniqueChatMode: false });
    },
  },
  {
    name: "shoutout",
    aliases: ["so"],
    description: "Highlight another channel for viewers to follow",
    role: "mod",
    options: [
      { name: "channel", description: "Channel to shout out", type: "user", required: true },
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
    description: "Grant a user VIP status",
    role: "broadcaster",
    options: [
      { name: "username", description: "User to grant VIP status", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      await addChannelVip({ broadcasterId: ctx.broadcasterId, userId: username as string });
    },
  },
  {
    name: "unvip",
    description: "Revoke a user's VIP status",
    role: "broadcaster",
    options: [
      { name: "username", description: "User to revoke VIP from", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      await removeChannelVip({ broadcasterId: ctx.broadcasterId, userId: username as string });
    },
  },
  {
    name: "raid",
    description: "Raid another channel",
    role: "broadcaster",
    options: [
      { name: "channel", description: "Channel to raid", type: "user", required: true },
    ],
    execute: async ({ channel }, ctx) => {
      await startRaid({
        fromBroadcasterId: ctx.broadcasterId,
        toBroadcasterId: channel as string,
      });
    },
  },
  {
    name: "unraid",
    description: "Cancel a pending raid",
    role: "broadcaster",
    options: [],
    execute: async (_, ctx) => {
      await cancelRaid({ broadcasterId: ctx.broadcasterId });
    },
  },
  {
    name: "me",
    description: "Send a message as an action",
    role: "regular",
    options: [
      { name: "message", description: "Action text", type: "string", required: true },
    ],
    execute: async ({ message }, ctx) => {
      await sendChatMessage({
        broadcasterId: ctx.broadcasterId,
        message: `/me ${message as string}`,
      });
    },
  },
  {
    name: "warn",
    description: "Warn a user without timing them out",
    role: "mod",
    options: [
      { name: "username", description: "User to warn", type: "user", required: true },
      { name: "reason", description: "Reason for the warning", type: "string", required: true },
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
    description: "Add a stream marker at the current point",
    role: "broadcaster",
    options: [
      { name: "description", description: "Note for the marker (max 140 chars)", type: "string" },
    ],
    execute: async ({ description }) => {
      await createStreamMarker({
        description: (description as string | null) ?? undefined,
      });
    },
  },
  {
    name: "color",
    description: "Change your display color in chat",
    role: "regular",
    options: [
      {
        name: "color",
        description: "Display color",
        type: "enum",
        required: true,
        values: [
          "blue", "blue_violet", "cadet_blue", "chocolate", "coral", "dodger_blue",
          "firebrick", "golden_rod", "green", "hot_pink", "orange_red", "red",
          "sea_green", "spring_green", "yellow_green",
        ],
      },
    ],
    execute: async ({ color }) => {
      await updateUserChatColor({ color: color as NamedUserColor });
    },
  },
  {
    name: "title",
    description: "Change the stream title",
    role: "broadcaster",
    options: [
      { name: "title", description: "New stream title", type: "string", required: true },
    ],
    execute: async ({ title }, ctx) => {
      await modifyChannelInformation({
        broadcasterId: ctx.broadcasterId,
        title: title as string,
      });
    },
  },
  {
    name: "commercial",
    description: "Run a commercial break",
    role: "broadcaster",
    options: [
      {
        name: "length",
        description: "Commercial length in seconds",
        type: "enum",
        required: true,
        values: ["30", "60", "90", "120", "150", "180"],
      },
    ],
    execute: async ({ length }, ctx) => {
      await startCommercial({
        broadcasterId: ctx.broadcasterId,
        length: Number(length) as CommercialLength,
      });
    },
  },
];

const deatchCommands: Command[] = [
  {
    name: "user",
    description: "Open a user's profile card",
    role: "regular",
    options: [
      { name: "username", description: "User to view", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      ctx.openUserCard(username as string);
    },
  },
  {
    name: "purge",
    description: "Clear a user's recent messages",
    role: "mod",
    options: [
      { name: "username", description: "User to purge", type: "user", required: true },
    ],
    execute: async ({ username }, ctx) => {
      await banUser({
        broadcasterId: ctx.broadcasterId,
        userId: username as string,
        duration: 1,
        reason: null,
      });
    },
  },
  {
    name: "uptime",
    description: "Show how long the stream has been live",
    role: "regular",
    options: [],
    execute: async (_, ctx) => {
      try {
        const r = await getStreams({ userIds: [ctx.broadcasterId] });
        const s = r.data[0];
        if (!s) {
          appendLocalNotice(ctx.broadcasterId, "Stream is offline");
          return;
        }
        const ms = Date.now() - new Date(s.started_at).getTime();
        appendLocalNotice(ctx.broadcasterId, `Uptime: ${formatUptime(ms)}`);
      } catch {
        appendLocalNotice(ctx.broadcasterId, "Failed to fetch uptime");
      }
    },
  },
  {
    name: "followage",
    description: "Show how long you've followed this channel",
    role: "regular",
    options: [],
    execute: async (_, ctx) => {
      const me = user();
      if (!me) return;
      try {
        const r = await getFollowedChannels({
          userId: me.id,
          broadcasterId: ctx.broadcasterId,
        });
        const f = r[0];
        if (!f) {
          appendLocalNotice(ctx.broadcasterId, "You're not following this channel");
          return;
        }
        const since = new Date(f.followed_at).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        });
        appendLocalNotice(ctx.broadcasterId, `Following since ${since}`);
      } catch {
        appendLocalNotice(ctx.broadcasterId, "Failed to fetch followage");
      }
    },
  },
  {
    name: "nickname",
    description: "Set a custom display name for a user (only visible to you)",
    role: "regular",
    options: [
      { name: "username", description: "User to rename", type: "user", required: true },
      { name: "nickname", description: "Name to display instead", type: "string", required: true },
    ],
    execute: async ({ username, nickname }) => {
      const login = loginFromUserId(username as string);
      if (!login) return;
      setUserNickname(login, nickname as string);
    },
  },
  {
    name: "unnickname",
    description: "Clear a user's custom nickname",
    role: "regular",
    options: [
      { name: "username", description: "User to reset", type: "user", required: true },
    ],
    execute: async ({ username }) => {
      const login = loginFromUserId(username as string);
      if (!login) return;
      removeUserNickname(login);
    },
  },
  {
    name: "mute",
    description: "Hide a user's messages (only affects your view)",
    role: "regular",
    options: [
      { name: "username", description: "User to mute", type: "user", required: true },
    ],
    execute: async ({ username }) => {
      muteUser(username as string);
    },
  },
  {
    name: "unmute",
    description: "Show a user's messages again",
    role: "regular",
    options: [
      { name: "username", description: "User to unmute", type: "user", required: true },
    ],
    execute: async ({ username }) => {
      unmuteUser(username as string);
    },
  },
];

export const commands: Command[] = [...twitchCommands, ...deatchCommands];
