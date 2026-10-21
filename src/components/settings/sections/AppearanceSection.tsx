import { t } from "../../../lib/i18n/index.ts";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import AppearancePreview from "../appearance/AppearancePreview.tsx";
import ThemeCard from "../appearance/ThemeCard.tsx";
import ReadabilityCard from "../appearance/ReadabilityCard.tsx";
import DensityCard from "../appearance/DensityCard.tsx";
import MessagesCard from "../appearance/MessagesCard.tsx";
import ShownInChatCard from "../appearance/ShownInChatCard.tsx";
import BadgesCard from "../appearance/BadgesCard.tsx";

export default function AppearanceSection() {
  return (
    <PageBody
      title={t("SETTINGS_APPEARANCE")}
      lede={t("SETTINGS_APPEARANCE_LEDE")}
    >
      <Card>
        <CardLabel>{t("SETTINGS_APPEARANCE_PREVIEW")}</CardLabel>
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
