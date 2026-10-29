export const THEMES = ["system", "dark", "light"] as const;
export type Theme = (typeof THEMES)[number];
export type ResolvedTheme = Exclude<Theme, "system">;

export const DEFAULT_ACCENT_HEX = "#9481ff";
