import { For, Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import Chip from "../../../kit/Chip.tsx";
import ChipInput from "../../../kit/ChipInput.tsx";
import Segmented from "../../../kit/Segmented.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import {
  addModerationReason,
  moderationAutoShoutoutOnRaid,
  moderatorTools,
  moderationKeyboard,
  moderationQuickTimeout,
  moderationReasons,
  QUICK_TIMEOUTS,
  removeModerationReason,
  setModerationAutoShoutoutOnRaid,
  setModeratorTools,
  setModerationKeyboard,
  setModerationQuickTimeout,
} from "../../preferences/index.ts";

export default function ModerationSettings() {
  return (
    <Page title={t("SETTINGS_MODERATION_TITLE")}>
      <Card>
        <CardLabel>{t("SETTINGS_MODERATION_TOOLS_TITLE")}</CardLabel>
        <FormRow
          label={t("SETTINGS_MODERATION_MODERATOR_TOOLS_LABEL")}
          description={t("SETTINGS_MODERATION_MODERATOR_TOOLS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_MODERATION_MODERATOR_TOOLS_LABEL")}
            checked={moderatorTools()}
            onChange={setModeratorTools}
          />
        </FormRow>
        <FormRow
          label={t("SETTINGS_MODERATION_KEYBOARD_LABEL")}
          description={t("SETTINGS_MODERATION_KEYBOARD_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_MODERATION_KEYBOARD_LABEL")}
            checked={moderationKeyboard()}
            onChange={setModerationKeyboard}
          />
        </FormRow>
      </Card>
      <Card>
        <CardLabel>{t("SETTINGS_MODERATION_QUICK_TITLE")}</CardLabel>
        <FormRow
          label={t("SETTINGS_MODERATION_QUICK_TIMEOUT_LABEL")}
          description={t("SETTINGS_MODERATION_QUICK_TIMEOUT_DESCRIPTION")}
        >
          <Segmented
            label={t("SETTINGS_MODERATION_QUICK_TIMEOUT_LABEL")}
            value={moderationQuickTimeout()}
            options={QUICK_TIMEOUTS.map((value) => ({ value, label: value }))}
            onChange={setModerationQuickTimeout}
          />
        </FormRow>
        <FormRow
          label={t("SETTINGS_MODERATION_REASONS_LABEL")}
          description={t("SETTINGS_MODERATION_REASONS_DESCRIPTION")}
          layout="stacked"
        >
          <ChipInput
            placeholder={t("SETTINGS_MODERATION_REASONS_PLACEHOLDER")}
            onAdd={addModerationReason}
          />
          <Show when={moderationReasons().length > 0}>
            <div class="flex flex-wrap gap-1.5">
              <For each={moderationReasons()}>
                {(reason) => (
                  <Chip
                    label={reason}
                    onRemove={() => removeModerationReason(reason)}
                  />
                )}
              </For>
            </div>
          </Show>
        </FormRow>
      </Card>
      <Card>
        <CardLabel>{t("SETTINGS_MODERATION_AUTOMATION_TITLE")}</CardLabel>
        <FormRow
          label={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS_LABEL")}
          description={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_MODERATION_SHOUTOUT_RAIDERS_LABEL")}
            checked={moderationAutoShoutoutOnRaid()}
            onChange={setModerationAutoShoutoutOnRaid}
          />
        </FormRow>
      </Card>
    </Page>
  );
}
