import {
  ChartColumn,
  Gift,
  HeartHandshake,
  Pin,
  Scale,
  Shield,
  Swords,
  Target,
  TrainFront,
  Trophy,
  Tv,
} from "lucide-solid";
import type { JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { ActivityKind } from "../../../shared/activities.ts";

const ICONS = {
  pinned: Pin,
  shield: Shield,
  unbans: Scale,
  ads: Tv,
  hypeTrain: TrainFront,
  goals: Target,
  charity: HeartHandshake,
  drops: Gift,
  poll: ChartColumn,
  prediction: Trophy,
  raid: Swords,
} satisfies Record<ActivityKind, unknown>;

export function ActivityIcon(props: { kind: ActivityKind }): JSX.Element {
  return <Dynamic component={ICONS[props.kind]} />;
}
