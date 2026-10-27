/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { usableIn } from "./emotes.ts";

Deno.test("emotes the channel offers and every emoji are usable", () => {
  const usable = usableIn([
    {
      id: "s",
      label: "S",
      emotes: [{ name: "Kappa", url: "" }],
    },
  ]);
  const values = ["Kappa", "subOnly", "😀", "🇫🇮"];
  assertEquals(values.filter(usable), ["Kappa", "😀", "🇫🇮"]);
});
