type Sections = Record<string, unknown>;
type Migration = (sections: Sections) => Sections;

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  !!raw && typeof raw === "object" && !Array.isArray(raw);

export function moveFields(
  sections: Sections,
  from: string,
  to: string,
  keys: readonly string[],
): Sections {
  const source = sections[from];
  if (!isRecord(source)) return sections;
  const target = isRecord(sections[to]) ? { ...sections[to] } : {};
  const rest = { ...source };
  for (const key of keys) {
    if (!(key in source)) continue;
    target[key] = source[key];
    delete rest[key];
  }
  return { ...sections, [from]: rest, [to]: target };
}

const windowSettingsToGeneral: Migration = (sections) =>
  moveFields(sections, "advanced", "general", [
    "alwaysOnTop",
    "autostart",
    "discordRichPresence",
  ]);

const MIGRATIONS: Migration[] = [windowSettingsToGeneral];

export const PREFERENCES_VERSION = MIGRATIONS.length;

export function migrate(
  sections: Sections,
  from: number,
  steps: readonly Migration[] = MIGRATIONS,
): Sections {
  return steps.slice(Math.max(0, from)).reduce((current, step, i) => {
    try {
      return step(current);
    } catch (e) {
      console.warn(`preferences: migration ${from + i + 1} skipped`, e);
      return current;
    }
  }, sections);
}
