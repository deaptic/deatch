import { afterEach, expect, test, vi } from "vite-plus/test";
import { bool, custom, object, text } from "./fields.ts";
import { MIGRATIONS, migrate, moveFields } from "./migrations.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

test("a field that throws falls back alone, its neighbours keep their values", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const broken = custom<number>(
    () => 1,
    () => {
      throw new Error("bad");
    },
  );
  const section = object({ kept: bool(false), broken, name: text() });
  expect(section.read({ kept: true, broken: 5, name: "x" })).toStrictEqual({
    kept: true,
    broken: 1,
    name: "x",
  });
});

test("unknown fields are dropped and new ones start at their default", () => {
  const section = object({ kept: bool(false), added: bool(true) });
  expect(section.read({ kept: true, removed: 3 })).toStrictEqual({
    kept: true,
    added: true,
  });
});

test("moved fields keep their values and leave the rest behind", () => {
  const sections = { a: { x: 1, y: 2 }, b: { z: 3 } };
  expect(moveFields(sections, "a", "b", ["x", "missing"])).toStrictEqual({
    a: { y: 2 },
    b: { z: 3, x: 1 },
  });
});

test("migrations run from the stored version, and a failing one is skipped", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const steps = [
    {
      version: 1,
      run: (s: Record<string, unknown>) => ({ ...s, first: true }),
    },
    {
      version: 2,
      run: () => {
        throw new Error("bad");
      },
    },
    {
      version: 3,
      run: (s: Record<string, unknown>) => ({ ...s, third: true }),
    },
  ];
  expect(migrate({}, 0, steps)).toStrictEqual({ first: true, third: true });
  expect(migrate({}, 2, steps)).toStrictEqual({ third: true });
  expect(migrate({}, 9, steps)).toStrictEqual({});
});

test("migration versions count up from 1 without gaps", () => {
  expect(MIGRATIONS.map((step) => step.version)).toStrictEqual(
    MIGRATIONS.map((_, i) => i + 1),
  );
});
