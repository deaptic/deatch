import { createSignal } from "solid-js";
import { warnUser } from "../../lib/api/twitch/moderation.ts";
import Button from "../ui/Button.tsx";
import Dialog from "../ui/Dialog.tsx";
import Textarea from "../ui/Textarea.tsx";
import { autofocus } from "../../lib/reactive/focus.ts";
import { t } from "../../lib/i18n/index.ts";

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
      // invokeCommand already toasted; the modal stays open to retry.
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
            {t("COMMON_CANCEL")}
          </Button>
          <Button
            variant="danger"
            onClick={warn}
            loading={pending()}
            disabled={!reason().trim()}
          >
            {t("MENU_WARN")}
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
