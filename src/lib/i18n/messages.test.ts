import { IntlMessageFormat } from "intl-messageformat";
import { expect, test } from "vite-plus/test";
import enUS from "../../locales/en-US.json" with { type: "json" };
import enGB from "../../locales/en-GB.json" with { type: "json" };

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
});

test("both Englishes have exactly the same keys", () => {
  expect(Object.keys(enGB).sort()).toStrictEqual(Object.keys(enUS).sort());
});
