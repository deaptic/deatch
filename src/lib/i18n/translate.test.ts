import { expect, test } from "vite-plus/test";
import { createTranslator } from "./translate.ts";

const { plain: t, rich } = createTranslator(
  {
    GREETING: "Hello",
    RAID: "{name} raided with {count, plural, one {# viewer} other {# viewers}}",
    REPLY: "Replying to <b>{user}</b>",
  },
  "en-GB",
);

test("returns plain messages as written", () => {
  expect(t("GREETING")).toBe("Hello");
});

test("fills values and picks the plural form", () => {
  expect(t("RAID", { name: "xqc", count: 1 })).toBe("xqc raided with 1 viewer");
  expect(t("RAID", { name: "xqc", count: 1500 })).toBe(
    "xqc raided with 1,500 viewers",
  );
});

test("hands each tagged part to its formatter, in message order", () => {
  const parts = rich<{ bold: string[] }>("REPLY", {
    user: "xqc",
    b: (chunks) => ({ bold: chunks.map(String) }),
  });
  expect(parts).toStrictEqual(["Replying to ", { bold: ["xqc"] }]);
});
