import { startCompressor } from "./audio/compressor.ts";
import { startRewardsPage } from "./rewards/page/watch.ts";
import { claimLife } from "./shared/life.ts";
import { startPlayerStats } from "./stats/page.ts";

const life = claimLife("Page");
startCompressor(life);
startRewardsPage(life);
startPlayerStats(life);
