import { IntlMessageFormat } from "intl-messageformat";
import { expect, test } from "vite-plus/test";
import en from "../../locales/en.json" with { type: "json" };

test("every English message parses", () => {
  const broken = Object.entries(en).filter(([, message]) => {
    try {
      new IntlMessageFormat(message, "en");
      return false;
    } catch {
      return true;
    }
  });
  expect(broken).toStrictEqual([]);
});
