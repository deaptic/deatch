import { expect, test } from "vite-plus/test";
import { usableIn } from "./emotes.ts";

test("emotes the channel offers and every emoji are usable", () => {
  const usable = usableIn([
    {
      id: "s",
      label: "S",
      emotes: [{ name: "Kappa", url: "" }],
    },
  ]);
  const values = ["Kappa", "subOnly", "😀", "🇫🇮"];
  expect(values.filter(usable)).toStrictEqual(["Kappa", "😀", "🇫🇮"]);
});
