import { t } from "../../../shared/i18n/index.ts";
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import {
  developerMode,
  developerShowLogs,
  setDeveloperMode,
  setDeveloperShowLogs,
} from "../../preferences/index.ts";

export default function DeveloperSettings() {
  return (
    <Page title={t("SETTINGS_DEVELOPER_TITLE")}>
      <Card>
        <FormRow
          label={t("SETTINGS_DEVELOPER_MODE_LABEL")}
          description={t("SETTINGS_DEVELOPER_MODE_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_DEVELOPER_MODE_LABEL")}
            checked={developerMode()}
            onChange={setDeveloperMode}
          />
        </FormRow>
        <FormRow
          label={t("SETTINGS_DEVELOPER_SHOW_LOGS_LABEL")}
          description={t("SETTINGS_DEVELOPER_SHOW_LOGS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_DEVELOPER_SHOW_LOGS_LABEL")}
            checked={developerShowLogs()}
            onChange={setDeveloperShowLogs}
          />
        </FormRow>
      </Card>
    </Page>
  );
}
