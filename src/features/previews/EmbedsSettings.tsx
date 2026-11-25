import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Page from "../../kit/Page.tsx";
import Card from "../../kit/Card.tsx";
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

export default function EmbedsSettings() {
  return (
    <Page title={t("SETTINGS_EMBEDS_TITLE")}>
      <Card>
        <FormRow
          label={t("SETTINGS_EMBEDS_PREVIEWS_LABEL")}
          description={t("SETTINGS_EMBEDS_PREVIEWS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_EMBEDS_PREVIEWS_LABEL")}
            checked={feedLinkPreviews()}
            onChange={setFeedLinkPreviews}
          />
        </FormRow>
        <FormRow
          label={t("SETTINGS_EMBEDS_TRUSTED_SITES_LABEL")}
          description={t("SETTINGS_EMBEDS_TRUSTED_SITES_DESCRIPTION")}
          layout="stacked"
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
        </FormRow>
      </Card>
    </Page>
  );
}
