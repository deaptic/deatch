import {
  Bookmark,
  ChartColumn,
  Eraser,
  Pencil,
  Shield,
  Swords,
  Trophy,
  Tv,
} from "lucide-solid";
import { For, onMount, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { startCommercial } from "../../lib/api/twitch/channels.ts";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import { createStreamMarker } from "../../lib/api/twitch/streams.ts";
import { AD_LENGTHS } from "../../lib/constants/twitch.ts";
import { streamForUserId } from "../../lib/stores/channels.ts";
import { activityFor } from "../../lib/stores/activity.ts";
import * as activity from "../../lib/services/activity.ts";
import IconButton from "../ui/IconButton.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import PopoverButton from "../ui/PopoverButton.tsx";
import ToolbarDivider from "../ui/ToolbarDivider.tsx";
import { CHAT_MODES } from "../chat/modes.ts";
import InfoForm from "./InfoForm.tsx";
import ModeButton from "./ModeButton.tsx";
import RaidForm from "./RaidForm.tsx";
import VoteForm from "./VoteForm.tsx";

type Props = {
  broadcasterId: string;
  isBroadcaster: boolean;
};

export default function ChannelToolbar(props: Props) {
  onMount(() => activity.load(props.broadcasterId, props.isBroadcaster));

  const live = () => streamForUserId(props.broadcasterId) !== undefined;
  const liveOnly = (action: string) =>
    live() ? undefined : t("CHANNEL_TOOLS_LIVE_ONLY", { action });
  const shield = () => activityFor(props.broadcasterId).shield;

  return (
    <div class="flex flex-wrap items-center gap-0.5 px-2 py-1">
      <For each={CHAT_MODES}>
        {(mode) => (
          <ModeButton mode={mode} broadcasterId={props.broadcasterId} />
        )}
      </For>
      <Show when={props.isBroadcaster}>
        <ToolbarDivider in="toolbar" />
        <PopoverButton
          look="panel"
          label={t("CHANNEL_TOOLS_EDIT_INFO")}
          icon={<Pencil class="size-4" />}
        >
          {(close) => (
            <InfoForm broadcasterId={props.broadcasterId} onDone={close} />
          )}
        </PopoverButton>
        <PopoverButton
          look="menu"
          label={t("CHANNEL_TOOLS_RUN_AD")}
          tip={liveOnly(t("CHANNEL_TOOLS_RUN_AD"))}
          disabled={!live()}
          icon={<Tv class="size-4" />}
        >
          {() => (
            <For each={AD_LENGTHS}>
              {(length) => (
                <MenuItem
                  label={t("CHANNEL_TOOLS_AD_SECONDS", { count: length })}
                  onClick={() =>
                    startCommercial({
                      broadcasterId: props.broadcasterId,
                      length,
                    }).catch(() => {})
                  }
                />
              )}
            </For>
          )}
        </PopoverButton>
        <IconButton
          label={t("CHANNEL_TOOLS_ADD_MARKER")}
          tip={liveOnly(t("CHANNEL_TOOLS_ADD_MARKER"))}
          size="sm"
          disabled={!live()}
          onClick={() => createStreamMarker().catch(() => {})}
        >
          <Bookmark class="size-4" />
        </IconButton>
        <ToolbarDivider in="toolbar" />
        <PopoverButton
          look="panel"
          label={t("CHANNEL_TOOLS_START_POLL")}
          icon={<ChartColumn class="size-4" />}
        >
          {(close) => (
            <VoteForm
              kind="poll"
              broadcasterId={props.broadcasterId}
              onDone={close}
            />
          )}
        </PopoverButton>
        <PopoverButton
          look="panel"
          label={t("CHANNEL_TOOLS_START_PREDICTION")}
          icon={<Trophy class="size-4" />}
        >
          {(close) => (
            <VoteForm
              kind="prediction"
              broadcasterId={props.broadcasterId}
              onDone={close}
            />
          )}
        </PopoverButton>
      </Show>
      <span class="flex-1" />
      <IconButton
        label={t(
          shield() ? "CHANNEL_TOOLS_SHIELD_OFF" : "CHANNEL_TOOLS_SHIELD_ON",
        )}
        size="sm"
        pressed={shield()}
        onClick={() => activity.setShield(props.broadcasterId, !shield())}
      >
        <Shield class="size-4" />
      </IconButton>
      <IconButton
        label={t("CHANNEL_TOOLS_CLEAR_CHAT")}
        size="sm"
        onClick={() =>
          deleteChatMessages({
            broadcasterId: props.broadcasterId,
            messageId: null,
          }).catch(() => {})
        }
      >
        <Eraser class="size-4" />
      </IconButton>
      <Show when={props.isBroadcaster}>
        <ToolbarDivider in="toolbar" />
        <PopoverButton
          look="panel"
          label={t("CHANNEL_TOOLS_RAID")}
          icon={<Swords class="size-4" />}
        >
          {(close) => (
            <RaidForm broadcasterId={props.broadcasterId} onDone={close} />
          )}
        </PopoverButton>
      </Show>
    </div>
  );
}
