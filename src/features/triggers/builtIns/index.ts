import type { MessageKey } from "../../../shared/i18n/index.ts";
import type { BuiltInTrigger } from "../../preferences/index.ts";
import type { BuiltInContext } from "./context.ts";
import { accountage } from "./accountage.ts";
import { followageOf } from "./followage.ts";
import { game } from "./game.ts";
import { title } from "./title.ts";
import { uptime } from "./uptime.ts";

export type { BuiltInContext } from "./context.ts";

type BuiltIn = {
  key: BuiltInTrigger;
  description: MessageKey;
  run: (ctx: BuiltInContext) => Promise<string | null>;
};

export const BUILT_INS: readonly BuiltIn[] = [
  {
    key: "accountage",
    description: "SETTINGS_TRIGGERS_BUILT_IN_ACCOUNTAGE_DESCRIPTION",
    run: accountage,
  },
  {
    key: "followage",
    description: "SETTINGS_TRIGGERS_BUILT_IN_FOLLOWAGE_DESCRIPTION",
    run: followageOf,
  },
  {
    key: "game",
    description: "SETTINGS_TRIGGERS_BUILT_IN_GAME_DESCRIPTION",
    run: game,
  },
  {
    key: "title",
    description: "SETTINGS_TRIGGERS_BUILT_IN_TITLE_DESCRIPTION",
    run: title,
  },
  {
    key: "uptime",
    description: "SETTINGS_TRIGGERS_BUILT_IN_UPTIME_DESCRIPTION",
    run: uptime,
  },
];

export const phraseOf = (builtIn: BuiltIn) => `!${builtIn.key}`;
