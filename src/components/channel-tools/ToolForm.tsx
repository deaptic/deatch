import type { JSX } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import Button from "../ui/Button.tsx";
import Dialog from "../ui/Dialog.tsx";

type Props = {
  title: string;
  description?: string;
  submitLabel: string;
  canSubmit: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  children: JSX.Element;
};

export default function ToolForm(props: Props) {
  return (
    <Dialog
      title={props.title}
      description={props.description}
      onClose={props.onCancel}
      onSubmit={() => {
        if (props.canSubmit) props.onSubmit();
      }}
      actions={
        <>
          <Button variant="neutral" onClick={() => props.onCancel()}>
            {t("CHANNEL_TOOLS_CANCEL")}
          </Button>
          <Button type="submit" disabled={!props.canSubmit}>
            {props.submitLabel}
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-4">{props.children}</div>
    </Dialog>
  );
}
