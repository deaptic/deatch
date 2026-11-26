import { createEffect, on } from "solid-js";
import * as raid from "./raid.ts";
import { isPinActive, secondsLeft } from "./model.ts";
import { activityShown } from "../preferences/index.ts";
import { activitiesFor, type ActivityKind } from "../../shared/activities.ts";
import * as activity from "./store.ts";
import * as clock from "../../shared/clock.ts";
import Transition from "../../kit/Transition.tsx";
import { setChannelForm } from "../navigation/index.ts";
import { knownUser } from "../users/index.ts";
import { hasPermission } from "../permissions/index.ts";
import { createChannelLink } from "../menus/index.ts";
import { cheermotes, thirdPartyEmoteMap } from "../emotes/index.ts";
import { mapFragment } from "../feed/index.ts";
import { MessageText } from "../message/index.ts";
import AdsRow from "./ui/rows/AdsRow.tsx";
import CharityRow from "./ui/rows/CharityRow.tsx";
import DropsRow from "./ui/rows/DropsRow.tsx";
import { claimDrops, dropOf } from "./drops.ts";
import HypeTrainRow from "./ui/rows/HypeTrainRow.tsx";
import GoalsRow from "./ui/rows/GoalsRow.tsx";
import PinnedRow from "./ui/rows/PinnedRow.tsx";
import PollRow from "./ui/rows/PollRow.tsx";
import PredictionRow from "./ui/rows/PredictionRow.tsx";
import RaidRow from "./ui/rows/RaidRow.tsx";
import ShieldRow from "./ui/rows/ShieldRow.tsx";
import UnbansRow from "./ui/rows/UnbansRow.tsx";
import Surface from "../../kit/Surface.tsx";

type Props = {
  broadcasterId: string;
  moderating: boolean;
  onOpenChannel: (broadcasterId: string) => void;
  onJumpToMessage: (messageId: string) => void;
};

export default function ActivityStrip(props: Props) {
  const current = () => activity.forChannel(props.broadcasterId);
  const shown = (kind: ActivityKind) =>
    activityShown(kind) && activitiesFor(props.moderating).includes(kind);
  const pinned = () => {
    const pin = current().pinned;
    return shown("pinned") && pin && isPinActive(pin, clock.now()) ? pin : null;
  };
  const shield = () => shown("shield") && current().shield;
  const hypeTrain = () => {
    const train = current().hypeTrain;
    return shown("hypeTrain") &&
      train &&
      Date.parse(train.expiresAt) > clock.now()
      ? train
      : null;
  };
  const goals = () => (shown("goals") ? current().goals : []);
  const charity = () => (shown("charity") ? current().charity : null);
  const drop = () => (shown("drops") ? dropOf(props.broadcasterId) : null);
  const raiding = () => {
    const r = raid.pending();
    return shown("raid") && r?.fromId === props.broadcasterId ? r : null;
  };
  const unbans = () => (shown("unbans") ? current().unbanRequests.length : 0);
  const ads = () => {
    const schedule = current().ads;
    const next = schedule?.nextAdMs;
    return shown("ads") && next && next > clock.now() ? schedule : null;
  };
  const poll = () => (shown("poll") ? current().poll : null);
  const prediction = () => (shown("prediction") ? current().prediction : null);

  createEffect(
    on(
      () => hasPermission(props.broadcasterId, "moderate"),
      () => activity.load(props.broadcasterId),
    ),
  );

  return (
    <Transition
      when={
        pinned() ||
        shield() ||
        goals().length ||
        charity() ||
        drop() ||
        raiding() ||
        unbans() ||
        ads() ||
        hypeTrain() ||
        poll() ||
        prediction()
      }
    >
      {() => (
        <div class="enter-expand">
          <Surface tone="none" edge="top" divided class="flex flex-col">
            <Transition when={shield()}>
              {() => (
                <ShieldRow
                  onTurnOff={() =>
                    activity.setShield(props.broadcasterId, false)
                  }
                />
              )}
            </Transition>
            <Transition when={unbans()}>
              {(count) => (
                <UnbansRow
                  count={count()}
                  onReview={() => setChannelForm("unbans")}
                />
              )}
            </Transition>
            <Transition when={pinned()}>
              {(pin) => (
                <PinnedRow
                  sender={pin().sender.displayName}
                  text={
                    <MessageText
                      fragments={pin().fragments.map(mapFragment)}
                      emotes={thirdPartyEmoteMap()}
                      cheermotes={cheermotes.forChannel(props.broadcasterId)}
                    />
                  }
                  endsAt={pin().endsAt}
                  now={clock.now()}
                  onJump={() => props.onJumpToMessage(pin().messageId)}
                  onUnpin={() =>
                    activity.unpin(props.broadcasterId, pin().messageId)
                  }
                />
              )}
            </Transition>
            <Transition when={ads()}>
              {(schedule) => (
                <AdsRow
                  schedule={schedule()}
                  now={clock.now()}
                  onSnooze={() => activity.snoozeAd(props.broadcasterId)}
                />
              )}
            </Transition>
            <Transition when={hypeTrain()}>
              {(train) => <HypeTrainRow train={train()} now={clock.now()} />}
            </Transition>
            <Transition when={goals().length}>
              {() => <GoalsRow goals={goals()} />}
            </Transition>
            <Transition when={charity()}>
              {(c) => <CharityRow charity={c()} />}
            </Transition>
            <Transition when={drop()}>
              {(d) => (
                <DropsRow
                  drop={d()}
                  onClaim={() => claimDrops(props.broadcasterId)}
                />
              )}
            </Transition>
            <Transition when={poll()}>
              {(p) => (
                <PollRow
                  poll={p()}
                  now={clock.now()}
                  onEnd={() => activity.endPoll(props.broadcasterId, p().id)}
                />
              )}
            </Transition>
            <Transition when={prediction()}>
              {(p) => (
                <PredictionRow
                  prediction={p()}
                  now={clock.now()}
                  onEnd={(end) =>
                    activity.endPrediction(props.broadcasterId, p(), end)
                  }
                />
              )}
            </Transition>
            <Transition when={raiding()}>
              {(r) => {
                const link = createChannelLink(
                  () => knownUser(r().target.id),
                  () => props.onOpenChannel(r().target.id),
                );
                return (
                  <>
                    <RaidRow
                      targetName={r().target.displayName}
                      secondsLeft={secondsLeft(r().startedAt, clock.now())}
                      targetLink={link}
                      onCancel={() => raid.cancel().catch(() => {})}
                    />
                    {link.menu()}
                  </>
                );
              }}
            </Transition>
          </Surface>
        </div>
      )}
    </Transition>
  );
}
