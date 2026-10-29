import { createSignal, type JSX } from "solid-js";
import en from "../../locales/en.json" with { type: "json" };
import {
  createTranslator,
  type MessageValues,
  type RichValues,
} from "./translate.ts";

export type MessageKey = keyof typeof en;

type Messages = Record<MessageKey, string>;

function load(messages: Messages, format: string) {
  return { format, ...createTranslator(messages, format) };
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
  return LOCALES[locale()].plain(key, values);
}

export function tRich(
  key: MessageKey,
  values: RichValues<JSX.Element>,
): JSX.Element {
  return LOCALES[locale()].rich(key, values);
}
