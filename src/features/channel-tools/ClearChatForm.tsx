import { createSignal } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { deleteChatMessages } from "../../platform/twitch/moderation.ts";
import Button from "../../kit/Button.tsx";
import Dialog from "../../kit/Dialog.tsx";

type Props = {
  broadcasterId: string;
  onDone: () => void;
};

export default function ClearChatForm(props: Props) {
  const [clearing, setClearing] = createSignal(false);

  function clear() {
    setClearing(true);
    deleteChatMessages({ broadcasterId: props.broadcasterId, messageId: null })
      .then(props.onDone)
      .catch(() => setClearing(false));
  }

  return (
    <Dialog
      title={t("CLEAR_CHAT_CONFIRM_TITLE")}
      description={t("CLEAR_CHAT_CONFIRM_DESCRIPTION")}
      onClose={props.onDone}
      actions={
        <>
          <Button variant="neutral" onClick={() => props.onDone()}>
            {t("UI_CANCEL_LABEL")}
          </Button>
          <Button variant="danger" onClick={clear} loading={clearing()}>
            {t("HEADER_CLEAR_CHAT_LABEL")}
          </Button>
        </>
      }
    />
  );
}
