import {
  ChartColumn,
  HeartHandshake,
  Scale,
  Shield,
  Swords,
  Target,
  Trophy,
} from "lucide-solid";
import type { JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { ActivityKind } from "../../lib/constants/activities.ts";

const ICONS = {
  shield: Shield,
  unbans: Scale,
  goals: Target,
  charity: HeartHandshake,
  poll: ChartColumn,
  prediction: Trophy,
  raid: Swords,
} satisfies Record<ActivityKind, unknown>;

export function ActivityIcon(props: { kind: ActivityKind }): JSX.Element {
  return <Dynamic component={ICONS[props.kind]} />;
}
