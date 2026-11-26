import type { ComponentProps } from "solid-js";
import SideRow from "../../kit/SideRow.tsx";
import { appearanceRailExpanded } from "../preferences/index.ts";

export type { SubTone } from "../../kit/SideRow.tsx";

export default function RailRow(
  props: Omit<ComponentProps<typeof SideRow>, "expanded">,
) {
  return <SideRow {...props} expanded={appearanceRailExpanded()} />;
}
