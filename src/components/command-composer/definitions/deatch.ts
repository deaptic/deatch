import { t } from "../../../lib/i18n/index.ts";
import { banUser } from "../../../lib/api/twitch/moderation.ts";
import { createClip } from "../../../lib/api/twitch/clips.ts";
import { getStreamsFromIds } from "../../../lib/api/twitch/streams.ts";
import { getFollowedAt } from "../../../lib/api/twitch/channels.ts";
import { user } from "../../../lib/stores/users.ts";
import { appendItem, appendLocalNotice } from "../../../lib/stores/feeds.ts";
import { feedEvent } from "../../../lib/utils/feedEvent.ts";
import { formatClock } from "../../../lib/format/stream.ts";
import { Time } from "../../../lib/utils/time.ts";
import type { Command } from "../types.ts";

export const deatchCommands: Command[] = [
  {
    name: "user",
    description: "COMMAND_USER",
    role: "regular",
    options: [
      {
        name: "username",
        description: "COMMAND_USER_USERNAME",
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
    description: "COMMAND_PURGE",
    role: "mod",
    options: [
      {
        name: "username",
        description: "COMMAND_PURGE_USERNAME",
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
    description: "COMMAND_CLIP",
    role: "regular",
    options: [
      { name: "title", description: "COMMAND_CLIP_TITLE", type: "string" },
      {
        name: "duration",
        description: "COMMAND_CLIP_DURATION",
        type: "duration",
        min: 5,
        max: 60,
        hint: "COMMAND_CLIP_DURATION_HINT",
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
        appendItem(
          ctx.broadcasterId,
          feedEvent("clip_created", t("COMMAND_CLIP_CREATED"), Date.now(), {
            id: clip.id,
            clip: { id: clip.id },
          }),
        );
      } catch {
        appendLocalNotice(ctx.broadcasterId, t("COMMAND_CLIP_FAILED"));
      }
    },
  },
  {
    name: "uptime",
    description: "COMMAND_UPTIME",
    role: "regular",
    options: [],
    execute: async (_, ctx) => {
      try {
        const [s] = await getStreamsFromIds({ userIds: [ctx.broadcasterId] });
        if (!s) {
          appendLocalNotice(ctx.broadcasterId, t("COMMAND_UPTIME_OFFLINE"));
          return;
        }
        const ms = Date.now() - new Date(s.startedAt).getTime();
        appendLocalNotice(
          ctx.broadcasterId,
          t("COMMAND_UPTIME_RESULT", { uptime: formatClock(ms) }),
        );
      } catch {
        appendLocalNotice(ctx.broadcasterId, t("COMMAND_UPTIME_FAILED"));
      }
    },
  },
  {
    name: "followage",
    description: "COMMAND_FOLLOWAGE",
    role: "regular",
    options: [],
    execute: async (_, ctx) => {
      const me = user();
      if (!me) return;
      try {
        const followedAt = await getFollowedAt({
          broadcasterId: ctx.broadcasterId,
          userId: me.id,
        });
        if (!followedAt) {
          appendLocalNotice(
            ctx.broadcasterId,
            t("COMMAND_FOLLOWAGE_NOT_FOLLOWING"),
          );
          return;
        }
        appendLocalNotice(
          ctx.broadcasterId,
          t("COMMAND_FOLLOWAGE_RESULT", {
            since: new Time(followedAt, "R").toString(),
          }),
        );
      } catch {
        appendLocalNotice(ctx.broadcasterId, t("COMMAND_FOLLOWAGE_FAILED"));
      }
    },
  },
];
