import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  feedDensity,
  feedShowCopypasta,
  feedShowDeletedContent,
  feedShowTimestamp,
  setFeedShowCopypasta,
  setFeedShowDeletedContent,
  setFeedShowTimestamp,
} from "../../../lib/stores/preferences.ts";

export default function MessagesCard() {
  return (
    <Card>
      <CardLabel>Messages</CardLabel>
      <SettingsRow
        label="Show timestamps"
        description="Time next to every message in the default display. Spacious always shows it."
      >
        <Toggle
          label="Show timestamps"
          disabled={feedDensity() === "comfortable"}
          checked={feedShowTimestamp()}
          onChange={setFeedShowTimestamp}
        />
      </SettingsRow>
      <SettingsRow
        label="Show deleted messages"
        description="Keep the text visible, dimmed, instead of hiding it."
      >
        <Toggle
          label="Show deleted messages"
          checked={feedShowDeletedContent()}
          onChange={setFeedShowDeletedContent}
        />
      </SettingsRow>
      <SettingsRow
        label="Copypasta button"
        description="Copy any message into your composer from its hover toolbar."
      >
        <Toggle
          label="Copypasta button"
          checked={feedShowCopypasta()}
          onChange={setFeedShowCopypasta}
        />
      </SettingsRow>
    </Card>
  );
}
