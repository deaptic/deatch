import { onMount } from "solid-js";
import { activityFor } from "../../lib/stores/activity.ts";
import { pendingRaid } from "../../lib/stores/raid.ts";
import { activityShown } from "../../lib/stores/preferences/appearance.ts";
import * as activity from "../../lib/services/activity.ts";
import * as clock from "../../lib/services/clock.ts";
import Presence from "../ui/Presence.tsx";
import AdsRow from "./activity/AdsRow.tsx";
import CharityRow from "./activity/CharityRow.tsx";
import GoalsRow from "./activity/GoalsRow.tsx";
import PollRow from "./activity/PollRow.tsx";
import PredictionRow from "./activity/PredictionRow.tsx";
import RaidRow from "./activity/RaidRow.tsx";
import ShieldRow from "./activity/ShieldRow.tsx";
import UnbansRow from "./activity/UnbansRow.tsx";

type Props = {
  broadcasterId: string;
  onOpenChannel: (broadcasterId: string) => void;
};

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
  const ads = () => {
    const schedule = current().ads;
    const next = schedule?.nextAdMs;
    return activityShown("ads") && next && next > clock.now() ? schedule : null;
  };
  const poll = () => (activityShown("poll") ? current().poll : null);
  const prediction = () =>
    activityShown("prediction") ? current().prediction : null;

  onMount(() => activity.load(props.broadcasterId));

  return (
    <Presence
      when={
        shield() ||
        goals().length ||
        charity() ||
        raiding() ||
        unbans() ||
        ads() ||
        poll() ||
        prediction()
      }
    >
      {() => (
        <div class="enter-expand">
          <div class="flex flex-col border-t border-line-soft divide-y divide-line-soft">
            <Presence when={shield()}>
              {() => <ShieldRow broadcasterId={props.broadcasterId} />}
            </Presence>
            <Presence when={unbans()}>
              {(count) => <UnbansRow count={count()} />}
            </Presence>
            <Presence when={ads()}>
              {(schedule) => (
                <AdsRow
                  broadcasterId={props.broadcasterId}
                  schedule={schedule()}
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
              {(r) => (
                <RaidRow raid={r()} onOpenChannel={props.onOpenChannel} />
              )}
            </Presence>
          </div>
        </div>
      )}
    </Presence>
  );
}
