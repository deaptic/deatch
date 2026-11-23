import { For, Show } from "solid-js";
import {
  goalProgress,
  goalsTitle,
  goalTitle,
} from "../../../lib/format/goals.ts";
import type { Goal } from "../../../lib/types/index.ts";
import Meter from "../../ui/Meter.tsx";
import ActivityRow from "../ActivityRow.tsx";
import { ActivityIcon } from "../activityIcons.tsx";
import LabeledBar from "../LabeledBar.tsx";

export default function GoalsRow(props: { goals: Goal[] }) {
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
