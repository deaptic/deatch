import { t } from "../../shared/i18n/index.ts";
import PageBody from "../../kit/PageBody.tsx";
import ThemeCard from "./ThemeCard.tsx";
import SizeCard from "./SizeCard.tsx";

export default function AppearanceSettings() {
  return (
    <PageBody title={t("SETTINGS_APPEARANCE_TITLE")}>
      <ThemeCard />
      <SizeCard />
    </PageBody>
  );
}
