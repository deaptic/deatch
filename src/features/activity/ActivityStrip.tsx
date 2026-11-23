import { onMount } from "solid-js";
import * as raid from "./raid.ts";
import { activityShown } from "../../lib/stores/preferences/appearance.ts";
import * as activity from "./store.ts";
import * as clock from "../../lib/services/clock.ts";
import Transition from "../../kit/Transition.tsx";
import AdsRow from "./rows/AdsRow.tsx";
import CharityRow from "./rows/CharityRow.tsx";
import GoalsRow from "./rows/GoalsRow.tsx";
import PollRow from "./rows/PollRow.tsx";
import PredictionRow from "./rows/PredictionRow.tsx";
import RaidRow from "./rows/RaidRow.tsx";
import ShieldRow from "./rows/ShieldRow.tsx";
import UnbansRow from "./rows/UnbansRow.tsx";

type Props = {
  broadcasterId: string;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function ActivityStrip(props: Props) {
  const current = () => activity.forChannel(props.broadcasterId);
  const shield = () => activityShown("shield") && current().shield;
  const goals = () => (activityShown("goals") ? current().goals : []);
  const charity = () => (activityShown("charity") ? current().charity : null);
  const raiding = () => {
    const r = raid.pending();
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
    <Transition
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
            <Transition when={shield()}>
              {() => <ShieldRow broadcasterId={props.broadcasterId} />}
            </Transition>
            <Transition when={unbans()}>
              {(count) => <UnbansRow count={count()} />}
            </Transition>
            <Transition when={ads()}>
              {(schedule) => (
                <AdsRow
                  broadcasterId={props.broadcasterId}
                  schedule={schedule()}
                />
              )}
            </Transition>
            <Transition when={goals().length}>
              {() => <GoalsRow goals={goals()} />}
            </Transition>
            <Transition when={charity()}>
              {(c) => <CharityRow charity={c()} />}
            </Transition>
            <Transition when={poll()}>
              {(p) => (
                <PollRow broadcasterId={props.broadcasterId} poll={p()} />
              )}
            </Transition>
            <Transition when={prediction()}>
              {(p) => (
                <PredictionRow
                  broadcasterId={props.broadcasterId}
                  prediction={p()}
                />
              )}
            </Transition>
            <Transition when={raiding()}>
              {(r) => (
                <RaidRow raid={r()} onOpenChannel={props.onOpenChannel} />
              )}
            </Transition>
          </div>
        </div>
      )}
    </Transition>
  );
}
