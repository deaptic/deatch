import { Download } from "lucide-solid";
import { Show } from "solid-js";
import { install, state } from "./store.ts";
import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import StripRow from "../../kit/StripRow.tsx";

export default function UpdateBanner() {
  const update = () => {
    const s = state();
    return s.kind === "none" ? null : s.update;
  };
  const installing = () => state().kind === "installing";
  const error = () => {
    const s = state();
    return s.kind === "failed" ? s.error : null;
  };
  const title = () => {
    if (installing()) return t("UPDATE_INSTALLING_STATUS");
    return error() ? t("UPDATE_FAILED_STATUS") : t("UPDATE_READY_STATUS");
  };
  return (
    <Show when={update()}>
      {(u) => (
        <StripRow
          tone="accent"
          icon={<Download />}
          title={<span data-tip={error() ?? undefined}>{title()}</span>}
          meta={u().version}
          actions={
            <Show when={!installing()}>
              <Button
                variant="inverse"
                size="sm"
                onClick={() => void install()}
              >
                {error() ? t("UPDATE_RETRY_LABEL") : t("UPDATE_INSTALL_LABEL")}
              </Button>
            </Show>
          }
        />
      )}
    </Show>
  );
}
