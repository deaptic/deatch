import { ChartColumn, Swords, Trophy } from "lucide-solid";
import { For, Match, Switch } from "solid-js";
import { t, tRich } from "../../lib/i18n/index.ts";
import { activityFor } from "../../lib/stores/activity.ts";
import { pendingRaid, RAID_DURATION_MS } from "../../lib/stores/raid.ts";
import { knownUser } from "../../lib/stores/users.ts";
import * as activity from "../../lib/services/activity.ts";
import * as clock from "../../lib/services/clock.ts";
import * as raid from "../../lib/services/raid.ts";
import { formatCountdown } from "../../lib/format/duration.ts";
import { formatViewers } from "../../lib/format/stream.ts";
import type { Poll, Prediction } from "../../lib/types/index.ts";
import Button from "../ui/Button.tsx";
import Chip from "../ui/Chip.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";
import ActivityRow from "./ActivityRow.tsx";
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

  return (
    <Presence when={current().poll || current().prediction || raiding()}>
      {() => (
        <div class="enter-expand">
          <div class="flex flex-col py-0.5">
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
                  <ActivityRow
                    icon={<Swords />}
                    title={tRich("CHAT_RAID_STATUS", {
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
                        <span class="font-semibold tabular-nums">{chunks}</span>
                      ),
                    })}
                  >
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => raid.cancel().catch(() => {})}
                    >
                      {t("CHAT_RAID_CANCEL")}
                    </Button>
                    {link.menu()}
                  </ActivityRow>
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
    <ActivityRow icon={<ChartColumn />} title={props.poll.title}>
      <For each={props.poll.choices}>
        {(choice) => (
          <Chip
            label={t("CHANNEL_TOOLS_CHOICE_VOTES", {
              choice: choice.title,
              votes: formatViewers(choice.votes),
            })}
          />
        )}
      </For>
      <span class="text-ink-soft tabular-nums">
        {t("CHANNEL_TOOLS_ENDS_IN", { time: until(props.poll.endsAt) })}
      </span>
      <Button
        variant="neutral"
        size="sm"
        onClick={() => activity.endPoll(props.broadcasterId, props.poll.id)}
      >
        {t("CHANNEL_TOOLS_END_POLL")}
      </Button>
    </ActivityRow>
  );
}

function PredictionRow(props: {
  broadcasterId: string;
  prediction: Prediction;
}) {
  const label = (o: Prediction["outcomes"][number]) =>
    t("CHANNEL_TOOLS_OUTCOME_POINTS", {
      outcome: o.title,
      points: formatViewers(o.channelPoints),
    });
  const end = (e: Parameters<typeof activity.endPrediction>[2]) =>
    activity.endPrediction(props.broadcasterId, props.prediction, e);

  return (
    <ActivityRow icon={<Trophy />} title={props.prediction.title}>
      <Switch>
        <Match
          when={
            props.prediction.phase.kind === "open" && props.prediction.phase
          }
        >
          {(open) => (
            <>
              <For each={props.prediction.outcomes}>
                {(o) => <Chip label={label(o)} />}
              </For>
              <span class="text-ink-soft tabular-nums">
                {t("CHANNEL_TOOLS_LOCKS_IN", { time: until(open().locksAt) })}
              </span>
              <Button
                variant="neutral"
                size="sm"
                onClick={() => end({ kind: "lock" })}
              >
                {t("CHANNEL_TOOLS_LOCK")}
              </Button>
            </>
          )}
        </Match>
        <Match when={props.prediction.phase.kind === "locked"}>
          <span class="text-ink-soft">{t("CHANNEL_TOOLS_PICK_WINNER")}</span>
          <For each={props.prediction.outcomes}>
            {(o) => (
              <Button
                variant="neutral"
                size="sm"
                pressed
                onClick={() => end({ kind: "resolve", winningOutcomeId: o.id })}
              >
                {label(o)}
              </Button>
            )}
          </For>
        </Match>
      </Switch>
      <Button
        variant="neutral"
        size="sm"
        onClick={() => end({ kind: "cancel" })}
      >
        {t("CHANNEL_TOOLS_REFUND")}
      </Button>
    </ActivityRow>
  );
}
