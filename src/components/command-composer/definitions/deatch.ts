import { banUser } from "../../../lib/api/twitch/moderation.ts";
import { createClip } from "../../../lib/api/twitch/clips.ts";
import { getStreams } from "../../../lib/api/twitch/streams.ts";
import { getFollowedChannels } from "../../../lib/api/twitch/channels.ts";
import { user } from "../../../lib/stores/users.ts";
import { muteUser, unmuteUser } from "../../../lib/stores/preferences.ts";
import { appendItem, appendLocalNotice } from "../../../lib/stores/feeds.ts";
import { formatDuration } from "../../../lib/format/stream.ts";
import { Time } from "../../../lib/utils/time.ts";
import type { Command } from "../types.ts";

export const deatchCommands: Command[] = [
  {
    name: "user",
    description: "Open a user's profile card",
    role: "regular",
    options: [
      {
        name: "username",
        description: "User to view",
        type: "user",
        required: true,
      },
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
      {
        name: "username",
        description: "User to purge",
        type: "user",
        required: true,
      },
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
    name: "clip",
    description: "Create a clip of the stream",
    role: "regular",
    options: [
      { name: "title", description: "Clip title", type: "string" },
      {
        name: "duration",
        description: "Clip length (5-60s, default 30s)",
        type: "duration",
        hint: "between 5s and 60s, e.g. 15s, 30s, 60s",
      },
    ],
    execute: async ({ title, duration }, ctx) => {
      try {
        const clip = await createClip(
          {
            broadcasterId: ctx.broadcasterId,
            title: (title as string | null) ?? undefined,
            duration: (duration as number | null) ?? undefined,
          },
          { silent: true },
        );
        appendItem(ctx.broadcasterId, {
          kind: "event",
          id: clip.id,
          notice_type: "clip_created",
          system_message: "Clip created",
          chatter_name: "",
          color: "",
          timestamp: Date.now(),
          clip: { id: clip.id },
        });
      } catch {
        appendLocalNotice(
          ctx.broadcasterId,
          "Failed to create clip (stream may be offline)",
        );
      }
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
        const ms = Date.now() - new Date(s.startedAt).getTime();
        appendLocalNotice(ctx.broadcasterId, `Uptime: ${formatDuration(ms)}`);
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
          appendLocalNotice(
            ctx.broadcasterId,
            "You're not following this channel",
          );
          return;
        }
        appendLocalNotice(
          ctx.broadcasterId,
          `You started following ${new Time(f.followedAt, "R")}`,
        );
      } catch {
        appendLocalNotice(ctx.broadcasterId, "Failed to fetch followage");
      }
    },
  },
  {
    name: "mute",
    description: "Hide a user's messages (only affects your view)",
    role: "regular",
    options: [
      {
        name: "username",
        description: "User to mute",
        type: "user",
        required: true,
      },
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
      {
        name: "username",
        description: "User to unmute",
        type: "user",
        required: true,
      },
    ],
    execute: async ({ username }) => {
      unmuteUser(username as string);
    },
  },
];
