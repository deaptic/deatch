/// <reference lib="deno.ns" />
import { assertAlmostEquals, assertEquals } from "@std/assert";
import { hexToOklch, hueOf, oklchCss, oklchToHex } from "./color.ts";

Deno.test("maps white and black to the ends of the lightness axis", () => {
  const white = hexToOklch("#ffffff")!;
  const black = hexToOklch("#000000")!;
  assertAlmostEquals(white.l, 1, 1e-3);
  assertAlmostEquals(white.c, 0, 1e-3);
  assertAlmostEquals(black.l, 0, 1e-3);
});

Deno.test("round-trips hex through oklch", () => {
  for (const hex of ["#9481ff", "#e53935", "#1a1a1a", "#00ff7f"]) {
    assertEquals(oklchToHex(hexToOklch(hex)!), hex);
  }
});

Deno.test("accepts hex without # and rejects anything else", () => {
  assertEquals(oklchToHex(hexToOklch("9481FF")!), "#9481ff");
  for (const bad of ["#fff", "red", "#12345g", ""]) {
    assertEquals(hexToOklch(bad), null, bad);
  }
});

Deno.test("formats css oklch with three decimals and optional alpha", () => {
  const color = { l: 0.123456, c: 0.0451, h: 300.98765 };
  assertEquals(oklchCss(color), "oklch(0.123 0.045 300.988)");
  assertEquals(oklchCss(color, 0.5), "oklch(0.123 0.045 300.988 / 0.5)");
});

Deno.test("reads the oklch hue of a coloured name", () => {
  assertAlmostEquals(hueOf("#ff0000")!, 29.2, 0.1);
  assertAlmostEquals(hueOf("#0000ff")!, 264.1, 0.1);
});

Deno.test("has no hue for greys, blanks, and junk", () => {
  assertEquals(hueOf("#808080"), undefined);
  assertEquals(hueOf(""), undefined);
  assertEquals(hueOf("red"), undefined);
});
