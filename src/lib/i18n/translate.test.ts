/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { createTranslator } from "./translate.ts";

const t = createTranslator(
  {
    GREETING: "Hello",
    RAID: "{name} raided with {count, plural, one {# viewer} other {# viewers}}",
  },
  "en-GB",
);

Deno.test("returns plain messages as written", () => {
  assertEquals(t("GREETING"), "Hello");
});

Deno.test("fills values and picks the plural form", () => {
  assertEquals(
    t("RAID", { name: "xqc", count: 1 }),
    "xqc raided with 1 viewer",
  );
  assertEquals(
    t("RAID", { name: "xqc", count: 1500 }),
    "xqc raided with 1,500 viewers",
  );
});
