import type { JSX } from "solid-js";
import { t } from "../shared/i18n/index.ts";
import Button from "./Button.tsx";
import Dialog from "./Dialog.tsx";

type Props = {
  title: string;
  description?: string;
  submitLabel: string;
  canSubmit: boolean;
  onSubmit: () => void;
  onClose: () => void;
  children: JSX.Element;
};

export default function FormDialog(props: Props) {
  return (
    <Dialog
      title={props.title}
      description={props.description}
      onClose={props.onClose}
      onSubmit={() => {
        if (props.canSubmit) props.onSubmit();
      }}
      actions={
        <>
          <Button variant="neutral" onClick={() => props.onClose()}>
            {t("UI_CANCEL_LABEL")}
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
