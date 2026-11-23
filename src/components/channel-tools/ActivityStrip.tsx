import { For, onMount, Show } from "solid-js";
import { t, tRich } from "../../lib/i18n/index.ts";
import { activityFor } from "../../lib/stores/activity.ts";
import { pendingRaid, RAID_DURATION_MS } from "../../lib/stores/raid.ts";
import { setChannelForm } from "../../lib/stores/ui.ts";
import { activityShown } from "../../lib/stores/preferences/appearance.ts";
import { knownUser, user } from "../../lib/stores/users.ts";
import * as activity from "../../lib/services/activity.ts";
import * as clock from "../../lib/services/clock.ts";
import * as raid from "../../lib/services/raid.ts";
import { formatCountdown } from "../../lib/format/duration.ts";
import { formatViewers } from "../../lib/format/stream.ts";
import { formatDonation } from "../../lib/format/currency.ts";
import { goalProgress, goalsTitle, goalTitle } from "../../lib/format/goals.ts";
import type {
  CharityCampaign,
  Goal,
  Poll,
  Prediction,
} from "../../lib/types/index.ts";
import Button from "../ui/Button.tsx";
import Meter from "../ui/Meter.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import ActivityRow from "./ActivityRow.tsx";
import { ActivityIcon } from "./activityIcons.tsx";
import LabeledBar from "./LabeledBar.tsx";
import OptionBars from "./OptionBars.tsx";
import Presence from "../ui/Presence.tsx";

type Props = {
  broadcasterId: string;
  onOpenChannel: (broadcasterId: string) => void;
};

const until = (iso: string) => formatCountdown(Date.parse(iso) - clock.now());

export default function ActivityStrip(props: Props) {
  const current = () => activityFor(props.broadcasterId);
  const shield = () => activityShown("shield") && current().shield;
  const goals = () => (activityShown("goals") ? current().goals : []);
  const charity = () => (activityShown("charity") ? current().charity : null);
  const raiding = () => {
    const r = pendingRaid();
    return activityShown("raid") && r?.fromId === props.broadcasterId
      ? r
      : null;
  };
  const unbans = () =>
    activityShown("unbans") ? current().unbanRequests.length : 0;
  const poll = () => (activityShown("poll") ? current().poll : null);
  const prediction = () =>
    activityShown("prediction") ? current().prediction : null;

  onMount(() =>
    activity.load(props.broadcasterId, props.broadcasterId === user()?.id),
  );

  return (
    <Presence
      when={
        shield() ||
        goals().length ||
        charity() ||
        raiding() ||
        unbans() ||
        poll() ||
        prediction()
      }
    >
      {() => (
        <div class="enter-expand">
          <div class="flex flex-col border-t border-line-soft divide-y divide-line-soft">
            <Presence when={shield()}>
              {() => (
                <ActivityRow
                  icon={<ActivityIcon kind="shield" />}
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
            <Presence when={unbans()}>
              {(count) => (
                <ActivityRow
                  icon={<ActivityIcon kind="unbans" />}
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
            <Presence when={goals().length}>
              {() => <GoalsRow goals={goals()} />}
            </Presence>
            <Presence when={charity()}>
              {(c) => <CharityRow charity={c()} />}
            </Presence>
            <Presence when={poll()}>
              {(p) => (
                <PollRow broadcasterId={props.broadcasterId} poll={p()} />
              )}
            </Presence>
            <Presence when={prediction()}>
              {(p) => (
                <PredictionRow
                  broadcasterId={props.broadcasterId}
                  prediction={p()}
                />
              )}
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
                      icon={<ActivityIcon kind="raid" />}
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
      icon={<ActivityIcon kind="poll" />}
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
      icon={<ActivityIcon kind="prediction" />}
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
      icon={<ActivityIcon kind="charity" />}
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

function GoalsRow(props: { goals: Goal[] }) {
  const only = () => (props.goals.length === 1 ? props.goals[0] : undefined);
  const meta = () => {
    const goal = only();
    return goal ? goalProgress(goal) : undefined;
  };
  return (
    <ActivityRow
      icon={<ActivityIcon kind="goals" />}
      title={goalsTitle(props.goals)}
      meta={meta()}
    >
      <Show
        when={only()}
        fallback={
          <div class="flex flex-col gap-3">
            <For each={props.goals}>
              {(goal) => (
                <LabeledBar
                  label={goalTitle(goal)}
                  detail={goalProgress(goal)}
                  value={goal.current}
                  max={goal.target}
                  tone="accent"
                />
              )}
            </For>
          </div>
        }
      >
        {(goal) => (
          <Meter
            value={goal().current}
            max={goal().target}
            label={goalTitle(goal())}
            tone="accent"
          />
        )}
      </Show>
    </ActivityRow>
  );
}
