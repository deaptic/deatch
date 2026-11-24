import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import PageBody from "../../kit/PageBody.tsx";
import Card from "../../kit/Card.tsx";
import Chip from "../../kit/Chip.tsx";
import ChipInput from "../../kit/ChipInput.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import {
  addTrustedDomain,
  feedLinkPreviews,
  removeTrustedDomain,
  setFeedLinkPreviews,
  trustedDomains,
} from "../preferences/index.ts";

export default function EmbedsSettings() {
  return (
    <PageBody title={t("SETTINGS_EMBEDS_TITLE")}>
      <Card>
        <SettingsRow
          label={t("SETTINGS_EMBEDS_PREVIEWS_LABEL")}
          description={t("SETTINGS_EMBEDS_PREVIEWS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_EMBEDS_PREVIEWS_LABEL")}
            checked={feedLinkPreviews()}
            onChange={setFeedLinkPreviews}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_EMBEDS_TRUSTED_SITES_LABEL")}
          description={t("SETTINGS_EMBEDS_TRUSTED_SITES_DESCRIPTION")}
          stacked
        >
          <ChipInput
            placeholder={t("SETTINGS_EMBEDS_TRUSTED_SITES_PLACEHOLDER")}
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
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
