import { bool, object, type Value } from "./fields.ts";

export const LINK = object({
  enabled: bool(true),
  audioLink: bool(false),
});

export type LinkPreferences = Value<typeof LINK>;
