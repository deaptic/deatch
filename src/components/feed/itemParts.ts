import type { JSX } from "solid-js";
import type { Density } from "../../lib/constants/density.ts";

export type RowTone =
  | "held"
  | "mention"
  | "cheer"
  | "redemption"
  | "first"
  | "event"
  | "plain";

export type Annotation = { content: JSX.Element; connector?: boolean };

export type ItemParts = {
  readonly density: Density;
  readonly tone: RowTone;
  readonly toneColor?: string;
  readonly dimmed?: boolean;
  readonly annotations?: Annotation[];
  readonly tile?: (active: () => boolean) => JSX.Element;
  readonly overlay?: (hovered: () => boolean) => JSX.Element;
  readonly content: JSX.Element;
  readonly onContextMenu?: (x: number, y: number) => void;
};

export type ItemLayout = {
  density: Density;
  continued?: boolean;
  selected?: boolean;
  flush?: boolean;
  showTimestamp?: boolean;
};
