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
        aria-label="Language"
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        class="h-control-sm cursor-pointer appearance-none rounded-sm border border-line bg-surface pl-3 pr-8 text-small font-semibold text-ink transition-colors duration-snap hover:bg-raised focus:outline-none focus:border-accent"
      >
        <For each={LANGUAGES}>
          {(lang) => (
            <option value={lang.code} class="bg-surface text-ink">
              {lang.label}
            </option>
          )}
        </For>
      </select>
      <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}
