import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  LOCALES,
  type Locale,
  type Messages,
  removeKey,
  setKey,
} from "./locale-keys.ts";

const USAGE = `usage:
  vp run locale set KEY --en "text" --fi "teksti" [--gb "UK text"]
  vp run locale remove KEY [KEY...]`;

const path = (locale: Locale) => `src/locales/${locale}.json`;

async function update(
  change: (messages: Messages, locale: Locale) => Messages,
) {
  for (const locale of LOCALES) {
    const messages = JSON.parse(await readFile(path(locale), "utf8"));
    await writeFile(
      path(locale),
      `${JSON.stringify(change(messages, locale), null, 2)}\n`,
    );
  }
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    en: { type: "string" },
    gb: { type: "string" },
    fi: { type: "string" },
  },
});
const [command, ...keys] = positionals;

if (command === "set" && keys.length === 1 && values.en && values.fi) {
  const [key] = keys as [string];
  const texts = { en: values.en, gb: values.gb, fi: values.fi };
  await update((messages, locale) => setKey(messages, locale, key, texts));
} else if (command === "remove" && keys.length > 0) {
  await update((messages) => keys.reduce(removeKey, messages));
} else {
  console.error(USAGE);
  process.exit(1);
}
