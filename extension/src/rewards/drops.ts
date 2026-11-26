import { asList, asRecord } from "../shared/record.ts";

export function earnedDrops(campaigns: unknown): string[] {
  return asList(campaigns)
    .map(asRecord)
    .filter(
      (campaign) =>
        campaign.status !== "EXPIRED" && Array.isArray(campaign.timeBasedDrops),
    )
    .flatMap((campaign) => asList(campaign.timeBasedDrops))
    .map((drop) => asRecord(asRecord(drop).self))
    .filter(
      (self) =>
        typeof self.dropInstanceID === "string" &&
        self.isClaimed !== true &&
        self.hasPreconditionsMet === true,
    )
    .map((self) => self.dropInstanceID as string);
}
