import { DENSITIES } from "../../../shared/density.ts";
import {
  bool,
  choice,
  custom,
  hexColor,
  object,
  oneOf,
  steps,
  text,
  textList,
  type Value,
} from "./fields.ts";

export const WIDGET_FADE_SECONDS = [0, 15, 30, 60] as const;
export const WIDGET_LINES = [5, 10, 20, 50] as const;
export const WIDGET_SIDES = ["bottom", "top"] as const;
export const WIDGET_ALIGNS = ["left", "right"] as const;
export const WIDGET_WIDTHS = ["fit", "full"] as const;
export const WIDGET_RANGES = {
  scale: { min: 50, max: 200, step: 25 },
  textSize: { min: 12, max: 36, step: 2 },
  backgroundOpacity: { min: 0, max: 100, step: 5 },
  radius: { min: 0, max: 24, step: 2 },
  edge: { min: 0, max: 48, step: 4 },
  gap: { min: 0, max: 24, step: 2 },
} as const;

const range = (key: keyof typeof WIDGET_RANGES, initial: number) =>
  steps([WIDGET_RANGES[key].min, WIDGET_RANGES[key].max], initial);

const CHAT_STYLE = object({
  name: text(),
  density: oneOf(DENSITIES, "comfortable"),
  showAvatars: bool(false),
  showBadges: bool(true),
  showTimestamp: bool(false),
  boldNames: bool(true),
  maxLines: choice(WIDGET_LINES, 20),
  fadeAfter: choice(WIDGET_FADE_SECONDS, 0),
  hideCommands: bool(false),
  hiddenUsers: textList({ nonEmpty: true }),
  backgroundColor: hexColor(),
  backgroundOpacity: range("backgroundOpacity", 100),
  radius: range("radius", 12),
  width: oneOf(WIDGET_WIDTHS, "fit"),
  nameColor: hexColor(),
  textColor: hexColor(),
  scale: range("scale", 100),
  textSize: range("textSize", 20),
  edge: range("edge", 16),
  gap: range("gap", 6),
  newest: oneOf(WIDGET_SIDES, "bottom"),
  fill: oneOf(WIDGET_SIDES, "bottom"),
  align: oneOf(WIDGET_ALIGNS, "left"),
});

export type ChatStyle = Value<typeof CHAT_STYLE>;
export type ChatWidget = { id: string; kind: "chat"; style: ChatStyle };
export type Widget = ChatWidget;

export const newChatStyle = (): ChatStyle => CHAT_STYLE.fallback();

function widget(item: unknown): Widget[] {
  if (!item || typeof item !== "object") return [];
  const w = item as Partial<Record<keyof Widget, unknown>>;
  if (typeof w.id !== "string" || w.kind !== "chat") return [];
  return [{ id: w.id, kind: "chat", style: CHAT_STYLE.read(w.style) }];
}

export const WIDGETS = object({
  list: custom<Widget[]>(
    () => [],
    (raw) => (Array.isArray(raw) ? raw.flatMap(widget) : []),
  ),
});
