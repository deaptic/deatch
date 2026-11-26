import { startPlayer } from "./audio/player.ts";
import { startAudioSync } from "./audio/sync.ts";
import { startBridge } from "./rewards/bridge.ts";
import { claimLife } from "./shared/life.ts";
import { startStatsReadout } from "./stats/readout.ts";

const life = claimLife("Content");
startAudioSync();
startPlayer(life);
startBridge(life);
startStatsReadout(life);
