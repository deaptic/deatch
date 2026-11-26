import { For } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Button from "../../kit/Button.tsx";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import Modal from "../../kit/Modal.tsx";
import SectionTitle from "../../kit/SectionTitle.tsx";
import { activeView, openSettings } from "../navigation/index.ts";
import {
  SHORTCUT_GROUPS,
  type ShortcutGroup,
  shortcutRows,
} from "./keyboard.ts";
import ShortcutRow from "./ShortcutRow.tsx";

const { chat, inbox, moderation, navigation, panels, settings, view } =
  SHORTCUT_GROUPS;

function groupsHere(): ShortcutGroup[] {
  const here = activeView();
  if (here === "inbox") return [inbox, navigation, panels];
  if (here === "settings") return [settings, navigation, panels];
  if (typeof here === "object") return [chat, moderation, navigation, panels];
  return [navigation, panels, view];
}

export default function ShortcutSheet(props: { onClose: () => void }) {
  return (
    <Modal
      variant="palette"
      label={t("SHORTCUTS_TITLE")}
      onClose={props.onClose}
    >
      <div class="flex items-center gap-3 px-2 pt-1 pb-3 shrink-0">
        <SectionTitle class="flex-1">{t("SHORTCUTS_TITLE")}</SectionTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            props.onClose();
            openSettings("keyboard");
          }}
        >
          {t("SHORTCUTS_ALL_LABEL")}
        </Button>
      </div>
      <div class="min-h-0 overflow-y-auto flex flex-col gap-3">
        <For each={groupsHere()}>
          {(group) => (
            <Card>
              <CardLabel>{t(group.title)}</CardLabel>
              <For each={shortcutRows(group)}>
                {(row) => <ShortcutRow row={row} />}
              </For>
            </Card>
          )}
        </For>
      </div>
    </Modal>
  );
}
