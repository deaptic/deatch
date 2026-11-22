import {
  Bookmark,
  ChartColumn,
  Eraser,
  Shield,
  Swords,
  Trophy,
  Tv,
} from "lucide-solid";
import { For, Match, Show, Switch } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { startCommercial } from "../../lib/api/twitch/channels.ts";
import { deleteChatMessages } from "../../lib/api/twitch/moderation.ts";
import { createStreamMarker } from "../../lib/api/twitch/streams.ts";
import { AD_LENGTHS } from "../../lib/constants/twitch.ts";
import { streamForUserId } from "../../lib/stores/channels.ts";
import { activityFor } from "../../lib/stores/activity.ts";
import { user } from "../../lib/stores/users.ts";
import * as activity from "../../lib/services/activity.ts";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import SubMenu from "../ui/SubMenu.tsx";
import RaidForm from "./RaidForm.tsx";
import VoteForm from "./VoteForm.tsx";

export type ToolForm = "poll" | "prediction" | "raid";

type ItemsProps = {
  broadcasterId: string;
  onOpen: (form: ToolForm) => void;
};

export function ChannelToolItems(props: ItemsProps) {
  const isBroadcaster = () => props.broadcasterId === user()?.id;
  const live = () => streamForUserId(props.broadcasterId) !== undefined;
  const liveHint = () =>
    live() ? undefined : t("CHANNEL_TOOLS_LIVE_ONLY_HINT");
  const shield = () => activityFor(props.broadcasterId).shield;

  return (
    <>
      <Show when={isBroadcaster()}>
        <MenuDivider />
        <MenuItem
          label={t("CHANNEL_TOOLS_START_POLL")}
          icon={<ChartColumn />}
          onClick={() => props.onOpen("poll")}
        />
        <MenuItem
          label={t("CHANNEL_TOOLS_START_PREDICTION")}
          icon={<Trophy />}
          onClick={() => props.onOpen("prediction")}
        />
        <MenuItem
          label={t("CHANNEL_TOOLS_RAID")}
          icon={<Swords />}
          onClick={() => props.onOpen("raid")}
        />
        <SubMenu
          label={t("CHANNEL_TOOLS_RUN_AD")}
          icon={<Tv />}
          hint={liveHint()}
          disabled={!live()}
        >
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
        </SubMenu>
        <MenuItem
          label={t("CHANNEL_TOOLS_ADD_MARKER")}
          icon={<Bookmark />}
          hint={liveHint()}
          disabled={!live()}
          onClick={() => createStreamMarker().catch(() => {})}
        />
      </Show>
      <MenuDivider />
      <MenuItem
        label={t(
          shield() ? "CHANNEL_TOOLS_SHIELD_OFF" : "CHANNEL_TOOLS_SHIELD_ON",
        )}
        icon={<Shield />}
        active={shield()}
        onClick={() => activity.setShield(props.broadcasterId, !shield())}
      />
      <MenuItem
        label={t("CHANNEL_TOOLS_CLEAR_CHAT")}
        icon={<Eraser />}
        tone="negative"
        onClick={() =>
          deleteChatMessages({
            broadcasterId: props.broadcasterId,
            messageId: null,
          }).catch(() => {})
        }
      />
    </>
  );
}

type FormProps = {
  form: ToolForm;
  broadcasterId: string;
  onDone: () => void;
};

export function ChannelToolForm(props: FormProps) {
  return (
    <Switch>
      <Match when={props.form === "raid"}>
        <RaidForm broadcasterId={props.broadcasterId} onDone={props.onDone} />
      </Match>
      <Match when={props.form !== "raid"}>
        <VoteForm
          kind={props.form === "poll" ? "poll" : "prediction"}
          broadcasterId={props.broadcasterId}
          onDone={props.onDone}
        />
      </Match>
    </Switch>
  );
}
