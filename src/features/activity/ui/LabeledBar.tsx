import { children, type JSX } from "solid-js";
import Meter from "../../../kit/Meter.tsx";
import Text from "../../../kit/Text.tsx";

type Props = {
  label: string;
  detail: string;
  value: number;
  max: number;
  tone: "neutral" | "accent";
  action?: JSX.Element;
};

export default function LabeledBar(props: Props) {
  const action = children(() => props.action);
  return (
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-3 min-w-0">
        <Text truncate tone="primary" class="flex-1 min-w-0">
          {props.label}
        </Text>
        <Text tone="soft" tabular class="shrink-0">
          {props.detail}
        </Text>
        {action()}
      </div>
      <Meter
        value={props.value}
        max={props.max}
        label={props.label}
        tone={props.tone}
      />
    </div>
  );
}
