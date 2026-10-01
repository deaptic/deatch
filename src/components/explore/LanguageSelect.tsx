import { Languages } from "lucide-solid";
import { languageName, searchLanguages } from "../../lib/utils/languages.ts";
import Combobox from "../ui/Combobox.tsx";

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
      placeholder="All languages"
      ariaLabel="Language"
      icon={<Languages />}
      onChange={props.onChange}
    />
  );
}
