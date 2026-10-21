import { IntlMessageFormat, type PrimitiveType } from "intl-messageformat";

export type MessageValues = Record<string, PrimitiveType>;

export type Translator<K extends string> = (
  key: K,
  values?: MessageValues,
) => string;

export function createTranslator<K extends string>(
  messages: Record<K, string>,
  locale: string,
): Translator<K> {
  const formats = new Map<K, IntlMessageFormat>();
  return (key, values) => {
    let format = formats.get(key);
    if (!format) {
      format = new IntlMessageFormat(messages[key], locale);
      formats.set(key, format);
    }
    // Primitive values always format to a single string.
    return format.format(values) as string;
  };
}
