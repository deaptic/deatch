import { createSignal, type JSX } from "solid-js";
import enUS from "../../locales/en-US.json" with { type: "json" };
import enGB from "../../locales/en-GB.json" with { type: "json" };
import fi from "../../locales/fi.json" with { type: "json" };
import {
  createTranslator,
  type MessageValues,
  type RichValues,
} from "./translate.ts";

export type MessageKey = keyof typeof enUS;

type Messages = Record<MessageKey, string>;

export const LANGUAGES = ["en-US", "en-GB", "fi"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  fi: "Suomi",
};

function load(messages: Messages, format: Language) {
  return { format, ...createTranslator(messages, format) };
}

const LOCALES: Record<Language, ReturnType<typeof load>> = {
  "en-US": load(enUS, "en-US"),
  "en-GB": load(enGB, "en-GB"),
  fi: load(fi, "fi"),
};

export function systemLanguage(): Language {
  const system = navigator.language;
  if (system.startsWith("fi")) return "fi";
  return system === "en-US" ? "en-US" : "en-GB";
}

export const [locale, setLocale] = createSignal<Language>("en-GB");

export function formatLocale(): string {
  return LOCALES[locale()].format;
}

export function t(key: MessageKey, values?: MessageValues): string {
  return LOCALES[locale()].plain(key, values);
}

export function tRich(
  key: MessageKey,
  values: RichValues<JSX.Element>,
): JSX.Element {
  return LOCALES[locale()].rich(key, values);
}
