import { Languages } from "lucide-solid";
import { languageName, searchLanguages } from "../languages.ts";
import Combobox from "../../../kit/Combobox.tsx";
import { t } from "../../../shared/i18n/index.ts";

type Props = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export default function LanguageSelect(props: Props) {
  return (
    <Combobox
      value={props.value}
      options={props.options}
      search={searchLanguages}
      label={languageName}
      placeholder={t("EXPLORE_LANGUAGE_ALL_LABEL")}
      ariaLabel={t("EXPLORE_LANGUAGE_LABEL")}
      icon={<Languages />}
      onChange={props.onChange}
    />
  );
}
