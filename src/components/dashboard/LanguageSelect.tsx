import { For } from "solid-js";
import { ChevronDown } from "lucide-solid";

const LANGUAGES: { code: string; label: string }[] = [
  { code: "", label: "All languages" },
  { code: "en", label: "English" },
  { code: "fi", label: "Finnish" },
  { code: "sv", label: "Swedish" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function LanguageSelect(props: Props) {
  return (
    <div class="relative">
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        class="cursor-pointer appearance-none rounded-md border border-border-muted bg-bg py-1.5 pl-3 pr-8 text-xs font-medium text-text transition-colors hover:bg-bg-light focus:outline-none"
      >
        <For each={LANGUAGES}>
          {(lang) => (
            <option value={lang.code} class="bg-bg text-text">
              {lang.label}
            </option>
          )}
        </For>
      </select>
      <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
    </div>
  );
}
