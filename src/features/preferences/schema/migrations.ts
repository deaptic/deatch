type Sections = Record<string, unknown>;
type Migration = (sections: Sections) => Sections;

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  !!raw && typeof raw === "object" && !Array.isArray(raw);

export function moveFields(
  sections: Sections,
  from: string,
  to: string,
  keys: readonly string[] | Readonly<Record<string, string>>,
): Sections {
  const source = sections[from];
  if (!isRecord(source)) return sections;
  const target = isRecord(sections[to]) ? { ...sections[to] } : {};
  const rest = { ...source };
  const renames = Array.isArray(keys)
    ? keys.map((key) => [key, key] as const)
    : Object.entries(keys);
  for (const [key, renamed] of renames) {
    if (!(key in source)) continue;
    target[renamed] = source[key];
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

const developerSettingsToDeveloper: Migration = (sections) =>
  moveFields(sections, "advanced", "developer", {
    developerMode: "mode",
    showLogs: "showLogs",
  });

const settingsFollowPages: Migration = (sections) =>
  [
    (s: Sections) =>
      moveFields(s, "general", "system", [
        "alwaysOnTop",
        "autostart",
        "discordRichPresence",
      ]),
    (s: Sections) =>
      moveFields(s, "advanced", "system", ["hardwareAcceleration"]),
    (s: Sections) => moveFields(s, "general", "language", ["clock"]),
    (s: Sections) =>
      moveFields(s, "appearance", "language", { language: "app" }),
    (s: Sections) => moveFields(s, "feed", "notifications", ["keywords"]),
    (s: Sections) =>
      moveFields(s, "streamer", "notifications", {
        on: "streamerMode",
        auto: "streamerAuto",
      }),
  ].reduce((current, move) => move(current), sections);

const moderatorToolsOnMeansShown: Migration = (sections) => {
  const moderation = sections.moderation;
  if (!isRecord(moderation) || !("actionsDisabled" in moderation)) {
    return sections;
  }
  const { actionsDisabled, ...rest } = moderation;
  return {
    ...sections,
    moderation:
      typeof actionsDisabled === "boolean"
        ? { ...rest, moderatorTools: !actionsDisabled }
        : rest,
  };
};

export type Step = { version: number; run: Migration };

export const MIGRATIONS: Step[] = [
  { version: 1, run: windowSettingsToGeneral },
  { version: 2, run: developerSettingsToDeveloper },
  { version: 3, run: settingsFollowPages },
  { version: 4, run: moderatorToolsOnMeansShown },
];

export const PREFERENCES_VERSION = MIGRATIONS.at(-1)?.version ?? 0;

export function migrate(
  sections: Sections,
  from: number,
  steps: readonly Step[] = MIGRATIONS,
): Sections {
  return steps
    .filter((step) => step.version > from)
    .reduce((current, step) => {
      try {
        return step.run(current);
      } catch (e) {
        console.warn(`preferences: migration ${step.version} skipped`, e);
        return current;
      }
    }, sections);
}
