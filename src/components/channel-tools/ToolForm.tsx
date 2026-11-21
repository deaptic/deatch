import type { JSX } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import Button from "../ui/Button.tsx";

type Props = {
  submitLabel: string;
  canSubmit: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  children: JSX.Element;
};

export default function ToolForm(props: Props) {
  return (
    <form
      class="w-90 max-w-full p-3 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (props.canSubmit) props.onSubmit();
      }}
    >
      {props.children}
      <div class="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={() => props.onCancel()}>
          {t("CHANNEL_TOOLS_CANCEL")}
        </Button>
        <Button type="submit" size="sm" disabled={!props.canSubmit}>
          {props.submitLabel}
        </Button>
      </div>
    </form>
  );
}
