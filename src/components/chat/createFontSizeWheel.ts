import { feedFontSize, setFeedFontSize } from "../../lib/stores/preferences.ts";
import {
  FONT_SIZE_STOPS,
  stepStop,
} from "../../lib/constants/accessibility.ts";
import * as readout from "../../lib/services/readout.ts";

export function createFontSizeWheel() {
  function onWheel(e: WheelEvent) {
    if (!e.altKey || e.deltaY === 0) return;
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    setFeedFontSize(stepStop(feedFontSize(), FONT_SIZE_STOPS, direction));
    readout.show(`${feedFontSize()}px`);
  }

  return { onWheel };
}
