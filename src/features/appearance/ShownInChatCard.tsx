import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import FormRow from "../../kit/FormRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import { EVENTS } from "../../shared/moderateActions.ts";
import {
  feedEvents,
  feedShowEvents,
  setFeedEvent,
  setFeedShowEvents,
} from "../preferences/index.ts";
import TypeChips from "./TypeChips.tsx";

export default function ShownInChatCard() {
  const items = () =>
    EVENTS.map((e) => ({
      key: e.key,
      label: t(e.label),
      description: t(e.description),
    }));
  return (
    <Card>
      <CardLabel>{t("SETTINGS_MESSAGES_SHOWN_IN_CHAT_TITLE")}</CardLabel>
      <FormRow
        label={t("SETTINGS_MESSAGES_EVENTS_SHOW_LABEL")}
        description={t("SETTINGS_MESSAGES_EVENTS_SHOW_DESCRIPTION")}
        keywords={items().map((i) => i.label)}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_EVENTS_SHOW_LABEL")}
          checked={feedShowEvents()}
          onChange={setFeedShowEvents}
        />
      </FormRow>
      <TypeChips
        label={t("SETTINGS_MESSAGES_EVENTS_SHOW_LABEL")}
        description={t("SETTINGS_MESSAGES_EVENTS_SHOW_DESCRIPTION")}
        items={items()}
        isOn={(key) => feedEvents()[key].show !== false}
        disabled={(key) => key !== "message" && !feedShowEvents()}
        onToggle={setFeedEvent}
      />
    </Card>
  );
}
