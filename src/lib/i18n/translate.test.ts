import { expect, test } from "vite-plus/test";
import { createTranslator } from "./translate.ts";

const t = createTranslator(
  {
    GREETING: "Hello",
    RAID: "{name} raided with {count, plural, one {# viewer} other {# viewers}}",
  },
  "en-GB",
);

test("returns plain messages as written", () => {
  expect(t("GREETING")).toStrictEqual("Hello");
});

test("fills values and picks the plural form", () => {
  expect(t("RAID", { name: "xqc", count: 1 })).toStrictEqual(
    "xqc raided with 1 viewer",
  );
  expect(t("RAID", { name: "xqc", count: 1500 })).toStrictEqual(
    "xqc raided with 1,500 viewers",
  );
});
