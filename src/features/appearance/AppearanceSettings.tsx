import { t } from "../../shared/i18n/index.ts";
import Page from "../../kit/Page.tsx";
import ThemeCard from "./ThemeCard.tsx";
import SizeCard from "./SizeCard.tsx";

export default function AppearanceSettings() {
  return (
    <Page title={t("SETTINGS_APPEARANCE_TITLE")}>
      <ThemeCard />
      <SizeCard />
    </Page>
  );
}
