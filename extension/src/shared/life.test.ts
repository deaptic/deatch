// @vitest-environment happy-dom
import { expect, test, vi } from "vite-plus/test";
import { claimLife } from "./life.ts";

const settle = () => new Promise((done) => setTimeout(done, 0));

test("a newer copy takes over and the older one goes quiet", async () => {
  const older = claimLife("Test");
  const olderSaw = vi.fn();
  const olderHeard = vi.fn();
  older.observe(document.body, { childList: true }, olderSaw);
  older.listen(document, "deatch-test", olderHeard);

  const newer = claimLife("Test");
  const newerSaw = vi.fn();
  const newerHeard = vi.fn();
  newer.observe(document.body, { childList: true }, newerSaw);
  newer.listen(document, "deatch-test", newerHeard);

  document.body.append(document.createElement("div"));
  document.dispatchEvent(new Event("deatch-test"));
  await settle();

  expect(older.current()).toBe(false);
  expect(newer.current()).toBe(true);
  expect(olderSaw).not.toHaveBeenCalled();
  expect(olderHeard).not.toHaveBeenCalled();
  expect(newerSaw).toHaveBeenCalled();
  expect(newerHeard).toHaveBeenCalledOnce();
});

test("copies of different scripts do not stop each other", () => {
  const page = claimLife("PageTest");
  claimLife("ContentTest");
  expect(page.current()).toBe(true);
});

test("a listener can be removed again", () => {
  const life = claimLife("RemoveTest");
  const heard = vi.fn();
  const stop = life.listen(document, "deatch-remove", heard);
  stop();
  document.dispatchEvent(new Event("deatch-remove"));
  expect(heard).not.toHaveBeenCalled();
});
