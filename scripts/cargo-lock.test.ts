import { expect, test } from "vite-plus/test";
import { lockedVersions, setLockedVersion } from "./cargo-lock.ts";

const LOCK = `[[package]]
name = "deatch"
version = "0.3.28"
dependencies = [
 "tauri",
]

[[package]]
name = "tauri"
version = "2.12.0"
source = "registry+https://github.com/rust-lang/crates.io-index"
`;

test("reads every locked crate version", () => {
  expect(lockedVersions(LOCK)).toStrictEqual(
    new Map([
      ["deatch", "0.3.28"],
      ["tauri", "2.12.0"],
    ]),
  );
});

test("sets one crate's version and leaves the rest", () => {
  const next = setLockedVersion(LOCK, "deatch", "0.4.0");
  expect(lockedVersions(next).get("deatch")).toBe("0.4.0");
  expect(lockedVersions(next).get("tauri")).toBe("2.12.0");
});

test("reads Windows line endings", () => {
  expect(lockedVersions(LOCK.replaceAll("\n", "\r\n")).get("tauri")).toBe(
    "2.12.0",
  );
});

test("refuses a crate that is not locked", () => {
  expect(() => setLockedVersion(LOCK, "missing", "1.0.0")).toThrow(
    "missing is not in Cargo.lock",
  );
});
