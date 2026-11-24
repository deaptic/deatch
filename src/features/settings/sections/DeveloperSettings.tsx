import { t } from "../../../shared/i18n/index.ts";
import PageBody from "../../../kit/PageBody.tsx";
import Card from "../../../kit/Card.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import {
  developerMode,
  developerShowLogs,
  setDeveloperMode,
  setDeveloperShowLogs,
} from "../../preferences/index.ts";

export default function DeveloperSettings() {
  return (
    <PageBody title={t("SETTINGS_DEVELOPER_TITLE")}>
      <Card>
        <SettingsRow
          label={t("SETTINGS_DEVELOPER_MODE_LABEL")}
          description={t("SETTINGS_DEVELOPER_MODE_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_DEVELOPER_MODE_LABEL")}
            checked={developerMode()}
            onChange={setDeveloperMode}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_DEVELOPER_SHOW_LOGS_LABEL")}
          description={t("SETTINGS_DEVELOPER_SHOW_LOGS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_DEVELOPER_SHOW_LOGS_LABEL")}
            checked={developerShowLogs()}
            onChange={setDeveloperShowLogs}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
