import { t } from "../../shared/i18n/index.ts";
import PageBody from "../../kit/PageBody.tsx";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import AppearancePreview from "./AppearancePreview.tsx";
import ThemeCard from "./ThemeCard.tsx";
import ReadabilityCard from "./ReadabilityCard.tsx";
import DensityCard from "./DensityCard.tsx";
import MessagesCard from "./MessagesCard.tsx";
import ShownInChatCard from "./ShownInChatCard.tsx";
import BadgesCard from "./BadgesCard.tsx";

export default function AppearanceSettings() {
  return (
    <PageBody title={t("SETTINGS_APPEARANCE_TITLE")}>
      <Card>
        <CardLabel>{t("SETTINGS_APPEARANCE_PREVIEW_TITLE")}</CardLabel>
        <AppearancePreview />
      </Card>
      <ThemeCard />
      <ReadabilityCard />
      <DensityCard />
      <MessagesCard />
      <ShownInChatCard />
      <BadgesCard />
    </PageBody>
  );
}
