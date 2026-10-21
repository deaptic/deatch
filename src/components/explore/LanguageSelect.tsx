import { Languages } from "lucide-solid";
import { languageName, searchLanguages } from "../../lib/utils/languages.ts";
import Combobox from "../ui/Combobox.tsx";
import { t } from "../../lib/i18n/index.ts";

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
      placeholder={t("EXPLORE_ALL_LANGUAGES")}
      ariaLabel={t("EXPLORE_LANGUAGE")}
      icon={<Languages />}
      onChange={props.onChange}
    />
  );
}
