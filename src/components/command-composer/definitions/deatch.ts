import { t } from "../../../lib/i18n/index.ts";
import { banUser } from "../../../lib/api/twitch/moderation.ts";
import * as clips from "../../../lib/services/clips.ts";
import { getStreamsFromIds } from "../../../lib/api/twitch/streams.ts";
import { getFollowedAt } from "../../../lib/api/twitch/channels.ts";
import { user } from "../../../lib/stores/users.ts";
import { appendLocalNotice } from "../../../lib/stores/feeds.ts";
import { formatClock } from "../../../lib/format/stream.ts";
import { Time } from "../../../lib/utils/time.ts";
import type { Command } from "../types.ts";

export const deatchCommands: Command[] = [
  {
    name: "user",
    description: "COMMAND_USER_DESCRIPTION",
    role: "regular",
    options: [
      {
        name: "username",
        description: "COMMAND_USER_USERNAME_LABEL",
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
    description: "COMMAND_PURGE_DESCRIPTION",
    role: "mod",
    options: [
      {
        name: "username",
        description: "COMMAND_PURGE_USERNAME_LABEL",
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
    description: "COMMAND_CLIP_DESCRIPTION",
    role: "regular",
    options: [
      {
        name: "title",
        description: "COMMAND_CLIP_TITLE_LABEL",
        type: "string",
      },
      {
        name: "duration",
        description: "COMMAND_CLIP_DURATION_LABEL",
        type: "duration",
        min: 5,
        max: 60,
        hint: "COMMAND_CLIP_DURATION_HINT",
      },
    ],
    execute: ({ title, duration }, ctx) =>
      clips.create(ctx.broadcasterId, {
        title: (title as string | null) ?? undefined,
        duration: (duration as number | null) ?? undefined,
      }),
  },
  {
    name: "uptime",
    description: "COMMAND_UPTIME_DESCRIPTION",
    role: "regular",
    options: [],
    execute: async (_, ctx) => {
      try {
        const [s] = await getStreamsFromIds(
          { userIds: [ctx.broadcasterId] },
          { silent: true },
        );
        if (!s) {
          appendLocalNotice(
            ctx.broadcasterId,
            t("COMMAND_UPTIME_OFFLINE_LINE"),
          );
          return;
        }
        const ms = Date.now() - new Date(s.startedAt).getTime();
        appendLocalNotice(
          ctx.broadcasterId,
          t("COMMAND_UPTIME_RESULT_LINE", { uptime: formatClock(ms) }),
        );
      } catch {
        appendLocalNotice(ctx.broadcasterId, t("COMMAND_UPTIME_FAILED_ERROR"));
      }
    },
  },
  {
    name: "followage",
    description: "COMMAND_FOLLOWAGE_DESCRIPTION",
    role: "regular",
    options: [],
    execute: async (_, ctx) => {
      const me = user();
      if (!me) return;
      try {
        const followedAt = await getFollowedAt(
          { broadcasterId: ctx.broadcasterId, userId: me.id },
          { silent: true },
        );
        if (!followedAt) {
          appendLocalNotice(
            ctx.broadcasterId,
            t("COMMAND_FOLLOWAGE_NOT_FOLLOWING_LINE"),
          );
          return;
        }
        appendLocalNotice(
          ctx.broadcasterId,
          t("COMMAND_FOLLOWAGE_RESULT_LINE", {
            since: new Time(followedAt, "R").toString(),
          }),
        );
      } catch {
        appendLocalNotice(
          ctx.broadcasterId,
          t("COMMAND_FOLLOWAGE_FAILED_ERROR"),
        );
      }
    },
  },
];
