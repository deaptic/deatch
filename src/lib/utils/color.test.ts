import { expect, test } from "vite-plus/test";
import { hexToOklch, hueOf, oklchCss } from "./color.ts";

test("maps white and black to the ends of the lightness axis", () => {
  const white = hexToOklch("#ffffff")!;
  const black = hexToOklch("#000000")!;
  expect(white.l).toBeCloseTo(1, 3);
  expect(white.c).toBeCloseTo(0, 3);
  expect(black.l).toBeCloseTo(0, 3);
});

test("matches reference oklch values for pure primaries", () => {
  const red = hexToOklch("#ff0000")!;
  expect(red.l).toBeCloseTo(0.628, 3);
  expect(red.c).toBeCloseTo(0.2577, 3);
  expect(red.h).toBeCloseTo(29.234, 2);
  const blue = hexToOklch("#0000ff")!;
  expect(blue.l).toBeCloseTo(0.452, 3);
  expect(blue.c).toBeCloseTo(0.3132, 3);
  expect(blue.h).toBeCloseTo(264.052, 2);
});

test("accepts hex without # and rejects anything else", () => {
  expect(hexToOklch("9481FF")).toStrictEqual(hexToOklch("#9481ff"));
  for (const bad of ["#fff", "red", "#12345g", ""]) {
    expect(hexToOklch(bad), bad).toBeNull();
  }
});

test("formats css oklch with three decimals and optional alpha", () => {
  const color = { l: 0.123456, c: 0.0451, h: 300.98765 };
  expect(oklchCss(color)).toBe("oklch(0.123 0.045 300.988)");
  expect(oklchCss(color, 0.5)).toBe("oklch(0.123 0.045 300.988 / 0.5)");
});

test("reads the oklch hue of a coloured name", () => {
  expect(hueOf("#ff0000")!).toBeCloseTo(29.2, 1);
  expect(hueOf("#0000ff")!).toBeCloseTo(264.1, 1);
});

test("has no hue for greys, blanks, and junk", () => {
  expect(hueOf("#808080")).toBeUndefined();
  expect(hueOf("")).toBeUndefined();
  expect(hueOf("red")).toBeUndefined();
});
