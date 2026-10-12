import { createSignal } from "solid-js";
import { warnUser } from "../../lib/api/twitch/moderation.ts";
import Button from "../ui/Button.tsx";
import Dialog from "../ui/Dialog.tsx";
import Textarea from "../ui/Textarea.tsx";

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
      title={`Warn ${props.userName}`}
      description="They must acknowledge the warning before chatting again."
      onClose={props.onClose}
      actions={
        <>
          <Button variant="neutral" onClick={props.onClose}>Cancel</Button>
          <Button
            variant="danger"
            onClick={warn}
            loading={pending()}
            disabled={!reason().trim()}
          >
            Warn
          </Button>
        </>
      }
    >
      <Textarea
        placeholder="Reason"
        value={reason()}
        onInput={(e) => setReason(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void warn();
          }
        }}
        autofocus
      />
    </Dialog>
  );
}
