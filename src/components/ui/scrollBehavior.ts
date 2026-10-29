import { REDUCED_MOTION } from "../../lib/constants/accessibility.ts";

export function scrollBehavior(): "smooth" | "instant" {
  return matchMedia(REDUCED_MOTION).matches ? "instant" : "smooth";
}
