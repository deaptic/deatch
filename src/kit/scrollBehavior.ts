import { REDUCED_MOTION } from "../shared/accessibility.ts";

export function scrollBehavior(): "smooth" | "instant" {
  return matchMedia(REDUCED_MOTION).matches ? "instant" : "smooth";
}
