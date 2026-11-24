import { t } from "../../../shared/i18n/index.ts";
import PageBody from "../../../kit/PageBody.tsx";
import { BlockedUsersCard } from "../../blocks/index.ts";

export default function AccountSettings() {
  return (
    <PageBody title={t("SETTINGS_ACCOUNT_TITLE")}>
      <BlockedUsersCard />
    </PageBody>
  );
}
