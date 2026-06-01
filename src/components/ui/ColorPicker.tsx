import Button from "./Button";

interface Props {
  swatchColor: string;
  value: string;
  onInput: (hex: string) => void;
  onReset: () => void;
  resetDisabled: boolean;
}

export default function ColorPicker(props: Props) {
  return (
    <div class="flex items-center gap-2">
      <label
        class="relative w-8 h-8 rounded border border-border cursor-pointer overflow-hidden"
        style={{ "background-color": props.swatchColor }}
        title="Pick color"
      >
        <input
          type="color"
          class="absolute inset-0 opacity-0 cursor-pointer"
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
        />
      </label>
      <Button
        variant="secondary"
        disabled={props.resetDisabled}
        onClick={() => props.onReset()}
      >
        Reset
      </Button>
    </div>
  );
}
