import { connected, gains } from "./store.ts";
import { t } from "../../shared/i18n/index.ts";
import { Show } from "solid-js";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import FormRow from "../../kit/FormRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import Text from "../../kit/Text.tsx";
import { linkEnabled, setLinkEnabled } from "../preferences/index.ts";
import { setLinkSynced } from "../navigation/index.ts";

export default function LinkCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_INTEGRATIONS_BROWSER_TITLE")}</CardLabel>
      <FormRow
        label={t("SETTINGS_INTEGRATIONS_LINK_LABEL")}
        description={t("SETTINGS_INTEGRATIONS_LINK_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_INTEGRATIONS_LINK_LABEL")}
          checked={linkEnabled()}
          onChange={(on) => {
            setLinkEnabled(on);
            if (!on) setLinkSynced(false);
          }}
        />
      </FormRow>
      <Show when={linkEnabled()}>
        <div class="px-4 pb-3 flex flex-col gap-2">
          <Text as="p" size="sm" tone="soft">
            {t("SETTINGS_INTEGRATIONS_LINK_EXTENSION_HINT")}
          </Text>
          <Show when={connected() && !gains()}>
            <Text as="p" size="sm" tone="caution">
              {t("SETTINGS_INTEGRATIONS_LINK_UPDATE_EXTENSION_HINT")}
            </Text>
          </Show>
        </div>
      </Show>
    </Card>
  );
}
