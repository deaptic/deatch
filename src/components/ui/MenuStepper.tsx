import { Minus, Plus } from "lucide-solid";
import type { JSX } from "solid-js";
import IconButton from "./IconButton.tsx";

type Props = {
  label: string;
  icon: JSX.Element;
  value: string;
  lessLabel: string;
  moreLabel: string;
  canLess: boolean;
  canMore: boolean;
  onStep: (direction: 1 | -1) => void;
  disabled?: boolean;
};

/// A menu row that steps a value down or up, showing it in between.
export default function MenuStepper(props: Props) {
  return (
    <div
      class={`h-control-md flex items-center gap-2.5 pl-2.5 text-body text-ink ${
        props.disabled ? "opacity-40" : ""
      }`}
    >
      <span class="shrink-0 w-4 grid place-items-center text-ink-soft [&>svg]:size-4">
        {props.icon}
      </span>
      <span class="truncate">{props.label}</span>
      <span class="ml-auto flex items-center gap-1">
        <IconButton
          label={props.lessLabel}
          size="sm"
          disabled={props.disabled || !props.canLess}
          onClick={() => props.onStep(-1)}
        >
          <Minus class="size-4" />
        </IconButton>
        <span class="w-10 text-center text-small text-ink-soft tabular-nums">
          {props.value}
        </span>
        <IconButton
          label={props.moreLabel}
          size="sm"
          disabled={props.disabled || !props.canMore}
          onClick={() => props.onStep(1)}
        >
          <Plus class="size-4" />
        </IconButton>
      </span>
    </div>
  );
}
