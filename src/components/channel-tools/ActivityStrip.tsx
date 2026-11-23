import {
  ChartColumn,
  HeartHandshake,
  Scale,
  Shield,
  Swords,
  Trophy,
} from "lucide-solid";
import { onMount, Show } from "solid-js";
import { t, tRich } from "../../lib/i18n/index.ts";
import { activityFor } from "../../lib/stores/activity.ts";
import { pendingRaid, RAID_DURATION_MS } from "../../lib/stores/raid.ts";
import { setChannelForm } from "../../lib/stores/ui.ts";
import { knownUser, user } from "../../lib/stores/users.ts";
import * as activity from "../../lib/services/activity.ts";
import * as clock from "../../lib/services/clock.ts";
import * as raid from "../../lib/services/raid.ts";
import { formatCountdown } from "../../lib/format/duration.ts";
import { formatViewers } from "../../lib/format/stream.ts";
import { formatDonation } from "../../lib/format/currency.ts";
import type {
  CharityCampaign,
  Poll,
  Prediction,
} from "../../lib/types/index.ts";
import Button from "../ui/Button.tsx";
import Meter from "../ui/Meter.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import ActivityRow from "./ActivityRow.tsx";
import OptionBars from "./OptionBars.tsx";
import Presence from "../ui/Presence.tsx";

type Props = {
  broadcasterId: string;
  onOpenChannel: (broadcasterId: string) => void;
};

const until = (iso: string) => formatCountdown(Date.parse(iso) - clock.now());

export default function ActivityStrip(props: Props) {
  const current = () => activityFor(props.broadcasterId);
  const raiding = () => {
    const r = pendingRaid();
    return r?.fromId === props.broadcasterId ? r : null;
  };

  onMount(() =>
    activity.load(props.broadcasterId, props.broadcasterId === user()?.id),
  );

  return (
    <Presence
      when={
        current().shield ||
        current().poll ||
        current().prediction ||
        current().charity ||
        current().unbanRequests.length ||
        raiding()
      }
    >
      {() => (
        <div class="enter-expand">
          <div class="flex flex-col border-t border-line-soft divide-y divide-line-soft">
            <Presence when={current().shield}>
              {() => (
                <ActivityRow
                  icon={<Shield />}
                  title={t("HEADER_SHIELD_ACTIVE_STATUS")}
                  actions={
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() =>
                        activity.setShield(props.broadcasterId, false)
                      }
                    >
                      {t("HEADER_SHIELD_OFF_LABEL")}
                    </Button>
                  }
                />
              )}
            </Presence>
            <Presence when={current().poll}>
              {(poll) => (
                <PollRow broadcasterId={props.broadcasterId} poll={poll()} />
              )}
            </Presence>
            <Presence when={current().prediction}>
              {(prediction) => (
                <PredictionRow
                  broadcasterId={props.broadcasterId}
                  prediction={prediction()}
                />
              )}
            </Presence>
            <Presence when={current().unbanRequests.length}>
              {(count) => (
                <ActivityRow
                  icon={<Scale />}
                  title={t("HEADER_UNBAN_REQUESTS_STATUS", { count: count() })}
                  actions={
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => setChannelForm("unbans")}
                    >
                      {t("HEADER_REVIEW_LABEL")}
                    </Button>
                  }
                />
              )}
            </Presence>
            <Presence when={current().charity}>
              {(charity) => <CharityRow charity={charity()} />}
            </Presence>
            <Presence when={raiding()}>
              {(r) => {
                const link = createChannelLink(
                  () => knownUser(r().target.id),
                  () => props.onOpenChannel(r().target.id),
                );
                const seconds = () =>
                  Math.max(
                    0,
                    Math.ceil(
                      (RAID_DURATION_MS - (clock.now() - r().startedAt)) / 1000,
                    ),
                  );
                return (
                  <>
                    <ActivityRow
                      icon={<Swords />}
                      title={tRich("HEADER_RAID_PENDING_STATUS", {
                        name: r().target.displayName,
                        seconds: seconds(),
                        target: (chunks) => (
                          <b
                            class={`font-semibold hover:underline ${link.cursor}`}
                            {...link.handlers}
                          >
                            {chunks}
                          </b>
                        ),
                        time: (chunks) => (
                          <span class="font-semibold tabular-nums">
                            {chunks}
                          </span>
                        ),
                      })}
                      actions={
                        <Button
                          variant="neutral"
                          size="sm"
                          onClick={() => raid.cancel().catch(() => {})}
                        >
                          {t("HEADER_CANCEL_RAID_LABEL")}
                        </Button>
                      }
                    />
                    {link.menu()}
                  </>
                );
              }}
            </Presence>
          </div>
        </div>
      )}
    </Presence>
  );
}

function PollRow(props: { broadcasterId: string; poll: Poll }) {
  return (
    <ActivityRow
      icon={<ChartColumn />}
      title={props.poll.title}
      meta={t("HEADER_POLL_ENDS_IN_STATUS", { time: until(props.poll.endsAt) })}
      actions={
        <Button
          variant="neutral"
          size="sm"
          onClick={() => activity.endPoll(props.broadcasterId, props.poll.id)}
        >
          {t("HEADER_END_POLL_LABEL")}
        </Button>
      }
    >
      <OptionBars
        options={props.poll.choices.map((c) => ({
          id: c.id,
          title: c.title,
          value: c.votes,
          detail: formatViewers(c.votes),
        }))}
      />
    </ActivityRow>
  );
}

function PredictionRow(props: {
  broadcasterId: string;
  prediction: Prediction;
}) {
  const end = (e: Parameters<typeof activity.endPrediction>[2]) =>
    activity.endPrediction(props.broadcasterId, props.prediction, e);
  const phase = () => props.prediction.phase;
  const options = () =>
    props.prediction.outcomes.map((o) => ({
      id: o.id,
      title: o.title,
      value: o.channelPoints,
      detail: t("HEADER_PREDICTION_POINTS_VALUE", {
        points: formatViewers(o.channelPoints),
      }),
    }));
  const meta = () => {
    const p = phase();
    return p.kind === "open"
      ? t("HEADER_PREDICTION_LOCKS_IN_STATUS", { time: until(p.locksAt) })
      : t("HEADER_PICK_WINNER_LABEL");
  };

  return (
    <ActivityRow
      icon={<Trophy />}
      title={props.prediction.title}
      meta={meta()}
      actions={
        <>
          <Show when={phase().kind === "open"}>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => end({ kind: "lock" })}
            >
              {t("HEADER_LOCK_PREDICTION_LABEL")}
            </Button>
          </Show>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => end({ kind: "cancel" })}
          >
            {t("HEADER_REFUND_PREDICTION_LABEL")}
          </Button>
        </>
      }
    >
      <OptionBars
        options={options()}
        action={
          phase().kind === "locked"
            ? (o) => (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() =>
                    end({ kind: "resolve", winningOutcomeId: o.id })
                  }
                >
                  {t("HEADER_PICK_OUTCOME_LABEL")}
                </Button>
              )
            : undefined
        }
      />
    </ActivityRow>
  );
}

function CharityRow(props: { charity: CharityCampaign }) {
  const raised = () => formatDonation(props.charity.current);
  const target = () => props.charity.target;
  const meta = () => {
    const goal = target();
    return goal
      ? t("HEADER_CHARITY_PROGRESS_STATUS", {
          current: raised(),
          target: formatDonation(goal),
        })
      : t("HEADER_CHARITY_RAISED_STATUS", { current: raised() });
  };
  return (
    <ActivityRow
      icon={<HeartHandshake />}
      title={props.charity.charityName}
      meta={meta()}
    >
      <Show when={target()}>
        {(goal) => (
          <Meter
            value={props.charity.current.value}
            max={goal().value}
            label={t("HEADER_CHARITY_PROGRESS_LABEL")}
            tone="accent"
          />
        )}
      </Show>
    </ActivityRow>
  );
}
