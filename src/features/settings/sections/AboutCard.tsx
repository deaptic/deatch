import { t } from "../../../shared/i18n/index.ts";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import Button from "../../../kit/Button.tsx";
import { updates } from "../../updater/index.ts";
import { about } from "../../about/index.ts";

export default function AboutCard() {
  const version = about.version;

  const status = () => {
    const state = updates.state();
    switch (state.kind) {
      case "current":
        return t("SETTINGS_SYSTEM_ABOUT_CURRENT_STATUS", {
          version: version(),
        });
      case "unreachable":
        return t("UPDATE_CHECK_ERROR");
      case "ready":
        return t("SETTINGS_SYSTEM_ABOUT_READY_STATUS", {
          version: state.update.version,
        });
      case "installing":
        return t("UPDATE_INSTALLING_STATUS");
      case "failed":
        return t("UPDATE_FAILED_STATUS");
      case "unchecked":
      case "checking":
        return t("SETTINGS_SYSTEM_ABOUT_VERSION_STATUS", {
          version: version(),
        });
    }
  };

  const action = () => {
    const kind = updates.state().kind;
    if (kind === "ready" || kind === "installing" || kind === "failed") {
      return (
        <Button
          variant="accent"
          loading={kind === "installing"}
          onClick={() => void updates.install()}
        >
          {kind === "failed"
            ? t("UPDATE_RETRY_LABEL")
            : t("UPDATE_INSTALL_LABEL")}
        </Button>
      );
    }
    return (
      <Button
        variant="neutral"
        loading={kind === "checking"}
        onClick={() => void updates.check()}
      >
        {kind === "unreachable"
          ? t("UPDATE_RETRY_LABEL")
          : t("SETTINGS_SYSTEM_ABOUT_CHECK_LABEL")}
      </Button>
    );
  };

  return (
    <Card>
      <CardLabel>{t("SETTINGS_SYSTEM_ABOUT_TITLE")}</CardLabel>
      <FormRow
        label={about.name()}
        description={version() ? status() : undefined}
      >
        {action()}
      </FormRow>
    </Card>
  );
}
