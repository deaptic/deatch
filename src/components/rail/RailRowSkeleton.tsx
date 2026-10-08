import { Show } from "solid-js";
import { appearanceRailExpanded } from "../../lib/stores/preferences.ts";
import Skeleton from "../ui/Skeleton.tsx";
import { rowHeight } from "../ui/rowHeight.ts";

export default function RailRowSkeleton() {
  return (
    <div class={`${rowHeight()} flex items-center gap-3 px-4`}>
      <Skeleton shape="circle" class="size-10 shrink-0" />
      <Show when={appearanceRailExpanded()}>
        <div class="flex-1 flex flex-col gap-1.5">
          <Skeleton shape="line" class="h-3.5 w-24" />
          <Skeleton shape="line" class="h-3 w-32" />
        </div>
      </Show>
    </div>
  );
}
