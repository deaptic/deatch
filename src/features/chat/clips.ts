import { createClip } from "../../platform/twitch/clips.ts";
import { t } from "../../shared/i18n/index.ts";
import { appendItem, appendLocalNotice, feedEvent } from "../feed/index.ts";

type ClipOptions = { title?: string; duration?: number };

export async function create(
  broadcasterId: string,
  options: ClipOptions = {},
): Promise<void> {
  try {
    const clip = await createClip(
      { broadcasterId, ...options },
      { silent: true },
    );
    appendItem(
      broadcasterId,
      feedEvent("clip_created", t("COMMAND_CLIP_CREATED_LINE"), Date.now(), {
        id: clip.id,
        clip: { id: clip.id },
      }),
    );
  } catch {
    appendLocalNotice(broadcasterId, t("COMMAND_CLIP_FAILED_ERROR"));
  }
}
