import { IntlMessageFormat, type PrimitiveType } from "intl-messageformat";

export type MessageValues = Record<string, PrimitiveType>;

export type RichValues<T> = Record<
  string,
  PrimitiveType | ((chunks: (string | T)[]) => T)
>;

export function createTranslator<K extends string>(
  messages: Record<K, string>,
  locale: string,
) {
  const formats = new Map<K, IntlMessageFormat>();
  function formatOf(key: K): IntlMessageFormat {
    let format = formats.get(key);
    if (!format) {
      format = new IntlMessageFormat(messages[key], locale);
      formats.set(key, format);
    }
    return format;
  }
  return {
    // Primitive values always format to a single string.
    plain: (key: K, values?: MessageValues) =>
      formatOf(key).format(values) as string,
    rich: <T>(key: K, values: RichValues<T>): (string | T)[] => {
      const parts = formatOf(key).format<T>(values);
      return Array.isArray(parts) ? parts : [parts];
    },
  };
}
