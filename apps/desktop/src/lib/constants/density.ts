export const DENSITIES = ["compact", "comfortable"] as const;
export type Density = (typeof DENSITIES)[number];
