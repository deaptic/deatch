export type Messages = Record<string, string>;

export const LOCALES = ["en-US", "en-GB", "fi"] as const;
export type Locale = (typeof LOCALES)[number];

export type Texts = { en: string; gb?: string; fi: string };

function sorted(messages: Messages): Messages {
  return Object.fromEntries(
    Object.entries(messages).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

function textFor(locale: Locale, texts: Texts): string {
  if (locale === "fi") return texts.fi;
  if (locale === "en-GB") return texts.gb ?? texts.en;
  return texts.en;
}

export function setKey(
  messages: Messages,
  locale: Locale,
  key: string,
  texts: Texts,
): Messages {
  return sorted({ ...messages, [key]: textFor(locale, texts) });
}

export function removeKey(messages: Messages, key: string): Messages {
  if (!(key in messages)) throw new Error(`no key ${key}`);
  const { [key]: _, ...rest } = messages;
  return rest;
}
