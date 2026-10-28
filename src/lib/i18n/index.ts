import { createSignal } from "solid-js";
import en from "../../locales/en.json" with { type: "json" };
import { createTranslator, type MessageValues } from "./translate.ts";

export type MessageKey = keyof typeof en;

type Messages = Record<MessageKey, string>;

function load(messages: Messages, format: string) {
  return { format, translate: createTranslator(messages, format) };
}

const LOCALES = {
  en: load(en, "en-GB"),
};

type Locale = keyof typeof LOCALES;

export const [locale] = createSignal<Locale>("en");

export function formatLocale(): string {
  return LOCALES[locale()].format;
}

export function t(key: MessageKey, values?: MessageValues): string {
  return LOCALES[locale()].translate(key, values);
}
