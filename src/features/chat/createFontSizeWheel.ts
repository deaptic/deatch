import { formatPx } from "../../shared/format/units.ts";
import { feedFontSize, stepFeedFontSize } from "../preferences/index.ts";
import * as readout from "../../lib/services/readout.ts";

export function createFontSizeWheel() {
  function onWheel(e: WheelEvent) {
    if (!e.altKey || e.deltaY === 0) return;
    e.preventDefault();
    stepFeedFontSize(e.deltaY < 0 ? 1 : -1);
    readout.show(formatPx(feedFontSize()));
  }

  return { onWheel };
}
