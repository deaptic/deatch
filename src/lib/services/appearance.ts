export type AppearanceColorKey =
  | "primary"
  | "bg-dark"
  | "bg"
  | "bg-light"
  | "text"
  | "text-muted"
  | "highlight"
  | "border"
  | "border-muted"
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "event-sub"
  | "event-raid"
  | "event-announce"
  | "event-charity"
  | "event-shoutout"
  | "event-follow"
  | "event-bits"
  | "event-channel-points";

type AppearanceColorGroup = {
  label: string;
  colors: { key: AppearanceColorKey; label: string }[];
};

export const APPEARANCE_COLOR_GROUPS: AppearanceColorGroup[] = [
  {
    label: "Accent",
    colors: [
      { key: "primary", label: "Primary" },
    ],
  },
  {
    label: "Background",
    colors: [
      { key: "bg-dark", label: "Background (dark)" },
      { key: "bg", label: "Background" },
      { key: "bg-light", label: "Background (light)" },
    ],
  },
  {
    label: "Text",
    colors: [
      { key: "text", label: "Text" },
      { key: "text-muted", label: "Text (muted)" },
    ],
  },
  {
    label: "Border",
    colors: [
      { key: "highlight", label: "Highlight" },
      { key: "border", label: "Border" },
      { key: "border-muted", label: "Border (muted)" },
    ],
  },
  {
    label: "Alert",
    colors: [
      { key: "danger", label: "Danger" },
      { key: "warning", label: "Warning" },
      { key: "success", label: "Success" },
      { key: "info", label: "Info" },
    ],
  },
  {
    label: "Event",
    colors: [
      { key: "event-sub", label: "Subscription" },
      { key: "event-raid", label: "Raid" },
      { key: "event-announce", label: "Announcement" },
      { key: "event-charity", label: "Charity" },
      { key: "event-shoutout", label: "Shoutout" },
      { key: "event-follow", label: "Follow" },
      { key: "event-bits", label: "Bits" },
      { key: "event-channel-points", label: "Channel points" },
    ],
  },
];

const ALL_COLOR_KEYS: AppearanceColorKey[] = APPEARANCE_COLOR_GROUPS.flatMap(
  (g) => g.colors.map((c) => c.key),
);

export function applyAppearanceColors(overrides: Record<string, string>) {
  const root = document.documentElement;
  for (const key of ALL_COLOR_KEYS) {
    const next = overrides[key];
    if (next) root.style.setProperty(`--color-${key}`, next);
    else root.style.removeProperty(`--color-${key}`);
  }
}

/// Returns the currently effective color for a slot as #rrggbb, resolving
/// either a user override or the @theme default via a canvas round-trip.
export function readAppearanceColorHex(key: AppearanceColorKey): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${key}`)
    .trim();
  return cssColorToHex(raw) ?? "#000000";
}

function cssColorToHex(input: string): string | null {
  if (!input) return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    ctx.fillStyle = "#000000";
    ctx.fillStyle = input;
  } catch {
    return null;
  }
  const out = String(ctx.fillStyle);
  if (/^#[0-9a-f]{6}$/i.test(out)) return out.toLowerCase();
  const m = out.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  const hex = [m[1], m[2], m[3]]
    .map((v) => Math.max(0, Math.min(255, parseInt(v, 10))).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}`;
}
