import { readFile } from "node:fs/promises";
import { notesFor } from "../src/shared/changelog.ts";

const CHANGELOG = "CHANGELOG.md";

const version = (process.argv[2] ?? "").replace(/^v/, "");
const notes = notesFor(await readFile(CHANGELOG, "utf8"), version);
if (!notes) {
  console.error(`${CHANGELOG} has no notes for v${version}`);
  process.exit(1);
}
console.log(notes);
