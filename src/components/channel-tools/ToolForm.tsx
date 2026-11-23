import type { JSX } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import Dialog from "../../kit/Dialog.tsx";

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
            {t("HEADER_CANCEL_LABEL")}
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
