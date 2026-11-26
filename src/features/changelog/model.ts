import { notesFor, parseNotes, type Notes } from "../../shared/changelog.ts";

const HIGHLIGHTED = ["New", "Improved"];

export function isNewToUser(
  seen: string | null,
  current: string,
  usedBefore: boolean,
): boolean {
  return seen === null ? usedBefore : seen !== current;
}

export function highlights(changelog: string, version: string): Notes | null {
  const text = notesFor(changelog, version);
  if (!text) return null;
  const { summary, groups } = parseNotes(text);
  const shown = groups.filter(
    (group) => HIGHLIGHTED.includes(group.title) && group.items.length > 0,
  );
  return summary || shown.length > 0 ? { summary, groups: shown } : null;
}
