import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import Chip from "../../kit/Chip.tsx";
import ChipInput from "../../kit/ChipInput.tsx";
import FormRow from "../../kit/FormRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import {
  addTrustedDomain,
  feedLinkPreviews,
  removeTrustedDomain,
  setFeedLinkPreviews,
  trustedDomains,
} from "../preferences/index.ts";

export default function LinksCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_MESSAGES_LINKS_TITLE")}</CardLabel>
      <FormRow
        label={t("SETTINGS_MESSAGES_LINK_PREVIEWS_LABEL")}
        description={t("SETTINGS_MESSAGES_LINK_PREVIEWS_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_LINK_PREVIEWS_LABEL")}
          checked={feedLinkPreviews()}
          onChange={setFeedLinkPreviews}
        />
      </FormRow>
      <FormRow
        label={t("SETTINGS_MESSAGES_TRUSTED_SITES_LABEL")}
        description={t("SETTINGS_MESSAGES_TRUSTED_SITES_DESCRIPTION")}
        layout="stacked"
      >
        <ChipInput
          placeholder={t("SETTINGS_MESSAGES_TRUSTED_SITES_PLACEHOLDER")}
          onAdd={addTrustedDomain}
        />
        <Show when={trustedDomains().length > 0}>
          <div class="flex flex-wrap gap-1.5">
            <For each={trustedDomains()}>
              {(domain) => (
                <Chip
                  label={domain}
                  onRemove={() => removeTrustedDomain(domain)}
                />
              )}
            </For>
          </div>
        </Show>
      </FormRow>
    </Card>
  );
}
