const RELEASE_HEADING = /^## v(\S+)(?:\s+[—–-]\s+(.+))?$/;
const GROUP_HEADING = /^### (.+)$/;
const ITEM = /^- (.+)$/;

export type Group = { title: string; items: string[] };
export type Notes = { summary: string; groups: Group[] };
export type Release = { version: string; date: string; notes: Notes };

type Section = { version: string; date: string; text: string };

function sections(changelog: string): Section[] {
  const found: Section[] = [];
  const lines: string[] = [];
  const close = () => {
    const last = found.at(-1);
    if (last) last.text = lines.join("\n").trim();
    lines.length = 0;
  };
  for (const line of changelog.replace(/\r\n/g, "\n").split("\n")) {
    const heading = RELEASE_HEADING.exec(line);
    if (heading?.[1]) {
      close();
      found.push({ version: heading[1], date: heading[2] ?? "", text: "" });
    } else {
      lines.push(line);
    }
  }
  close();
  return found;
}

export function notesFor(changelog: string, version: string): string | null {
  const section = sections(changelog).find((s) => s.version === version);
  return section?.text || null;
}

export function parseNotes(text: string): Notes {
  const summary: string[] = [];
  const groups: Group[] = [];
  for (const line of text.split("\n")) {
    const heading = GROUP_HEADING.exec(line);
    const item = ITEM.exec(line);
    const group = groups.at(-1);
    if (heading?.[1]) groups.push({ title: heading[1], items: [] });
    else if (item?.[1] && group) group.items.push(item[1]);
    else if (!group && line.trim()) summary.push(line.trim());
  }
  return { summary: summary.join(" "), groups };
}

export function releases(changelog: string): Release[] {
  return sections(changelog).map(({ version, date, text }) => ({
    version,
    date,
    notes: parseNotes(text),
  }));
}
