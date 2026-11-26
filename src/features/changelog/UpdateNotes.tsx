import { Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import Dialog from "../../kit/Dialog.tsx";
import Notes from "./Notes.tsx";
import { dismiss, openAll, update } from "./store.ts";

export default function UpdateNotes() {
  return (
    <Show when={update()} keyed>
      {(u) => (
        <Dialog
          title={t("CHANGELOG_UPDATE_TITLE", { version: u.version })}
          onClose={dismiss}
          onSubmit={dismiss}
          actions={
            <>
              <Button type="button" variant="ghost" onClick={openAll}>
                {t("CHANGELOG_ALL_CHANGES_LABEL")}
              </Button>
              <Button type="submit" variant="accent">
                {t("CHANGELOG_GOT_IT_LABEL")}
              </Button>
            </>
          }
        >
          <div class="max-h-80 overflow-y-auto">
            <Notes notes={u.notes} />
          </div>
        </Dialog>
      )}
    </Show>
  );
}
