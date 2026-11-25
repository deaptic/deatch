import FormRow from "./FormRow.tsx";
import Slider from "./Slider.tsx";
import Text from "./Text.tsx";

type Props = {
  label: string;
  description?: string;
  layout?: "inline" | "stacked";
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
};

export default function SliderRow(props: Props) {
  return (
    <FormRow
      label={props.label}
      description={props.description}
      layout={props.layout}
    >
      <div
        class={`flex items-center gap-3 ${props.layout === "stacked" ? "" : "w-64"}`}
      >
        <Slider
          label={props.label}
          value={props.value}
          min={props.min}
          max={props.max}
          step={props.step}
          format={props.format}
          onChange={props.onChange}
        />
        <Text
          align="right"
          size="sm"
          tabular
          tone="primary"
          class="w-16 shrink-0"
        >
          {props.format(props.value)}
        </Text>
      </div>
    </FormRow>
  );
}
