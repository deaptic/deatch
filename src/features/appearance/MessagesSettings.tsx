import { t } from "../../shared/i18n/index.ts";
import PageBody from "../../kit/PageBody.tsx";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import AppearancePreview from "./AppearancePreview.tsx";
import LayoutCard from "./LayoutCard.tsx";
import ReadabilityCard from "./ReadabilityCard.tsx";
import MessagesCard from "./MessagesCard.tsx";
import BadgesCard from "./BadgesCard.tsx";
import ShownInChatCard from "./ShownInChatCard.tsx";

export default function MessagesSettings() {
  return (
    <PageBody title={t("SETTINGS_MESSAGES_TITLE")}>
      <Card>
        <CardLabel>{t("SETTINGS_MESSAGES_PREVIEW_TITLE")}</CardLabel>
        <AppearancePreview />
      </Card>
      <LayoutCard />
      <ReadabilityCard />
      <MessagesCard />
      <BadgesCard />
      <ShownInChatCard />
    </PageBody>
  );
}
