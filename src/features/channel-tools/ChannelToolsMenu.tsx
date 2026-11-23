import {
  Bookmark,
  ChartColumn,
  Eraser,
  ListChecks,
  ListX,
  Shield,
  Swords,
  Trophy,
  Tv,
} from "lucide-solid";
import { For, Match, Show, Switch } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { startCommercial } from "../../platform/twitch/channels.ts";
import { deleteChatMessages } from "../../platform/twitch/moderation.ts";
import { createStreamMarker } from "../../platform/twitch/streams.ts";
import { AD_LENGTHS } from "../../shared/twitch.ts";
import { streamForUserId } from "../channels/index.ts";
import { knownUser } from "../users/index.ts";
import { showsControls } from "../permissions/index.ts";
import * as browser from "../../platform/browser.ts";
import { type ChannelForm, setChannelForm } from "../navigation/index.ts";
import * as activity from "../activity/index.ts";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import SubMenu from "../../kit/SubMenu.tsx";
import InfoForm from "./InfoForm.tsx";
import { RaidForm, VoteForm } from "../activity/index.ts";
import BlockedTermsForm from "./BlockedTermsForm.tsx";
import UnbanRequestsForm from "./UnbanRequestsForm.tsx";

type ItemsProps = {
  broadcasterId: string;
};

export function ChannelToolItems(props: ItemsProps) {
  const isBroadcaster = () =>
    showsControls(props.broadcasterId, "manageStream");
  const live = () => streamForUserId(props.broadcasterId) !== undefined;
  const shield = () => activity.forChannel(props.broadcasterId).shield;

  return (
    <>
      <Show when={isBroadcaster()}>
        <MenuDivider />
        <MenuItem
          label={t("HEADER_START_POLL_LABEL")}
          icon={<ChartColumn />}
          onClick={() => setChannelForm("poll")}
        />
        <MenuItem
          label={t("HEADER_START_PREDICTION_LABEL")}
          icon={<Trophy />}
          onClick={() => setChannelForm("prediction")}
        />
        <MenuItem
          label={t("HEADER_RAID_LABEL")}
          icon={<Swords />}
          onClick={() => setChannelForm("raid")}
        />
        <SubMenu
          label={t("HEADER_RUN_AD_LABEL")}
          icon={<Tv />}
          disabled={!live()}
        >
          <For each={AD_LENGTHS}>
            {(length) => (
              <MenuItem
                label={t("HEADER_AD_SECONDS_VALUE", { count: length })}
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
          label={t("HEADER_ADD_MARKER_LABEL")}
          icon={<Bookmark />}
          disabled={!live()}
          onClick={() => createStreamMarker().catch(() => {})}
        />
      </Show>
      <MenuDivider />
      <Show when={knownUser(props.broadcasterId)}>
        {(channel) => (
          <MenuItem
            label={t("HEADER_REWARD_QUEUE_LABEL")}
            icon={<ListChecks />}
            onClick={() => browser.openRewardQueue(channel().login)}
          />
        )}
      </Show>
      <MenuItem
        label={t("HEADER_BLOCKED_TERMS_LABEL")}
        icon={<ListX />}
        onClick={() => setChannelForm("blockedTerms")}
      />
      <MenuItem
        label={t(
          shield() ? "HEADER_SHIELD_OFF_LABEL" : "HEADER_SHIELD_ON_LABEL",
        )}
        icon={<Shield />}
        active={shield()}
        onClick={() => activity.setShield(props.broadcasterId, !shield())}
      />
      <MenuItem
        label={t("HEADER_CLEAR_CHAT_LABEL")}
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
  form: ChannelForm;
  broadcasterId: string;
  onDone: () => void;
};

export function ChannelToolForm(props: FormProps) {
  return (
    <Switch>
      <Match when={props.form === "info"}>
        <InfoForm broadcasterId={props.broadcasterId} onDone={props.onDone} />
      </Match>
      <Match when={props.form === "blockedTerms"}>
        <BlockedTermsForm
          broadcasterId={props.broadcasterId}
          onDone={props.onDone}
        />
      </Match>
      <Match when={props.form === "unbans"}>
        <UnbanRequestsForm
          broadcasterId={props.broadcasterId}
          onDone={props.onDone}
        />
      </Match>
      <Match when={props.form === "raid"}>
        <RaidForm broadcasterId={props.broadcasterId} onDone={props.onDone} />
      </Match>
      <Match when={props.form === "poll" || props.form === "prediction"}>
        <VoteForm
          kind={props.form === "poll" ? "poll" : "prediction"}
          broadcasterId={props.broadcasterId}
          onDone={props.onDone}
        />
      </Match>
    </Switch>
  );
}
