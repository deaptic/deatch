import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import Dialog from "../../kit/Dialog.tsx";
import LinkTarget from "../../kit/LinkTarget.tsx";
import Toggle from "../../kit/Toggle.tsx";
import * as previews from "./store.ts";

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
        fallback={<LinkTarget domain={props.url} url={props.url} />}
      >
        {(domain) => (
          <>
            <LinkTarget domain={domain()} url={props.url} />
            <label class="flex items-center justify-between gap-3 text-base text-ink-soft">
              {t("FEED_LINK_PROMPT_TRUST_LABEL")}
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
