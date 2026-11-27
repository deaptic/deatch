import { Radio } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import PulseIcon from "../../../kit/PulseIcon.tsx";

type Size = "sm" | "md" | "lg";

const DOTS: Record<Size, string> = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
};

type Props = {
  live: boolean;
  variant?: "dot" | "icon";
  size?: Size;
};

export default function LiveBadge(props: Props) {
  const label = () => t(props.live ? "UI_LIVE_STATUS" : "UI_OFFLINE_STATUS");
  return (
    <Show
      when={props.variant === "icon"}
      fallback={
        <span
          data-tip={label()}
          class={`absolute -bottom-px -right-px rounded-full ring-2 ring-surface ${
            props.live ? "bg-negative" : "bg-ink-faint"
          } ${DOTS[props.size ?? "md"]}`}
        />
      }
    >
      <span
        data-tip={label()}
        class="absolute -bottom-0.5 -right-0.5 size-5 rounded-full ring-2 ring-surface bg-surface grid place-items-center"
      >
        <PulseIcon tone={props.live ? "negative" : "faint"} pulse={props.live}>
          <Radio class="size-3.5" />
        </PulseIcon>
      </span>
    </Show>
  );
}
