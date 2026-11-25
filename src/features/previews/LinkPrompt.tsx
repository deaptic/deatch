import { Globe } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import Dialog from "../../kit/Dialog.tsx";
import SummaryCard from "../../kit/SummaryCard.tsx";
import Toggle from "../../kit/Toggle.tsx";
import * as previews from "./store.ts";
import Text from "../../kit/Text.tsx";

export default function LinkPrompt() {
  return (
    <Show when={previews.pendingLink()}>{(url) => <Prompt url={url()} />}</Show>
  );
}

function Prompt(props: { url: string }) {
  return (
    <Dialog
      title={t("FEED_LINK_PROMPT_TITLE")}
      description={t("FEED_LINK_PROMPT_DESCRIPTION")}
      onClose={previews.cancel}
      onSubmit={previews.confirm}
      actions={
        <>
          <Button type="button" variant="neutral" onClick={previews.cancel}>
            {t("FEED_LINK_PROMPT_CANCEL_LABEL")}
          </Button>
          <Button type="submit" variant="accent">
            {t("FEED_LINK_PROMPT_OPEN_LABEL")}
          </Button>
        </>
      }
    >
      <Show
        when={previews.pendingDomain()}
        fallback={
          <SummaryCard icon={<Globe />} title={props.url} detail={props.url} />
        }
      >
        {(domain) => (
          <>
            <SummaryCard icon={<Globe />} title={domain()} detail={props.url} />
            <label class="flex items-center justify-between gap-3">
              <Text size="md" tone="soft">
                {t("FEED_LINK_PROMPT_TRUST_LABEL")}
              </Text>
              <Toggle
                checked={previews.isTrusted(props.url)}
                onChange={(on) => previews.setTrusted(props.url, on)}
              />
            </label>
          </>
        )}
      </Show>
    </Dialog>
  );
}
