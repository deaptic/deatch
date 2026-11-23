import { IntlMessageFormat } from "intl-messageformat";
import { expect, test } from "vite-plus/test";
import enUS from "../../locales/en-US.json" with { type: "json" };
import enGB from "../../locales/en-GB.json" with { type: "json" };
import fi from "../../locales/fi.json" with { type: "json" };

const broken = (messages: Record<string, string>, locale: string) =>
  Object.entries(messages).filter(([, message]) => {
    try {
      new IntlMessageFormat(message, locale);
      return false;
    } catch {
      return true;
    }
  });

test("every English message parses", () => {
  expect(broken(enUS, "en-US")).toStrictEqual([]);
  expect(broken(enGB, "en-GB")).toStrictEqual([]);
  expect(broken(fi, "fi")).toStrictEqual([]);
});

test("every language has exactly the same keys", () => {
  const keys = Object.keys(enUS).sort();
  expect(Object.keys(enGB).sort()).toStrictEqual(keys);
  expect(Object.keys(fi).sort()).toStrictEqual(keys);
});
