import Button from "./Button.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  swatchColor: string;
  value: string;
  onInput: (hex: string) => void;
  onReset: () => void;
  resetDisabled: boolean;
};

export default function ColorPicker(props: Props) {
  return (
    <div class="flex items-center gap-2">
      <label
        class="relative size-7 rounded-full border border-line cursor-pointer overflow-hidden bg-(--swatch)"
        style={{ "--swatch": props.swatchColor }}
        data-tip={t("UI_PICK_COLOUR")}
      >
        <input
          type="color"
          aria-label={t("UI_PICK_COLOUR")}
          class="absolute inset-0 opacity-0 cursor-pointer"
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
        />
      </label>
      <Button
        variant="ghost"
        size="sm"
        disabled={props.resetDisabled}
        onClick={() => props.onReset()}
      >
        {t("UI_RESET")}
      </Button>
    </div>
  );
}
