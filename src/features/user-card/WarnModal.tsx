import { createSignal } from "solid-js";
import { warnUser } from "../../platform/twitch/moderation.ts";
import Button from "../../kit/Button.tsx";
import Dialog from "../../kit/Dialog.tsx";
import Textarea from "../../kit/Textarea.tsx";
import { autofocus } from "../../shared/solid/focus.ts";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  userId: string;
  userName: string;
  broadcasterId: string;
  onClose: () => void;
};

export default function WarnModal(props: Props) {
  const [reason, setReason] = createSignal("");
  const [pending, setPending] = createSignal(false);

  async function warn() {
    if (pending() || !reason().trim()) return;
    setPending(true);
    try {
      await warnUser({
        broadcasterId: props.broadcasterId,
        userId: props.userId,
        reason: reason().trim(),
      });
      props.onClose();
    } catch {
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      title={t("WARN_TITLE", { name: props.userName })}
      description={t("WARN_DESCRIPTION")}
      onClose={props.onClose}
      actions={
        <>
          <Button variant="neutral" onClick={props.onClose}>
            {t("WARN_CANCEL_LABEL")}
          </Button>
          <Button
            variant="negative"
            onClick={warn}
            loading={pending()}
            disabled={!reason().trim()}
          >
            {t("WARN_SUBMIT_LABEL")}
          </Button>
        </>
      }
    >
      <Textarea
        placeholder={t("WARN_REASON_PLACEHOLDER")}
        value={reason()}
        onInput={(e) => setReason(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void warn();
          }
        }}
        ref={autofocus}
      />
    </Dialog>
  );
}
