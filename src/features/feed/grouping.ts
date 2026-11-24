import type { Density } from "../../shared/density.ts";
import { feedGroupMessages, feedShowAvatars } from "../preferences/index.ts";

export const groupsMessages = (density: Density | undefined) =>
  density === "comfortable" && feedShowAvatars() && feedGroupMessages();
