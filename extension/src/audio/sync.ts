import { writePage } from "../shared/protocol.ts";
import { watchFlag } from "../shared/storage.ts";
import { type Audio, type AudioFeatures, effectiveAudio } from "./settings.ts";
import { loadAudio, onAudio } from "./store.ts";

export function startAudioSync() {
  let stored: Audio | null = null;
  const features: AudioFeatures = {
    gainControl: true,
    compressorControl: true,
  };

  function publish() {
    if (stored)
      writePage("audio", JSON.stringify(effectiveAudio(stored, features)));
  }

  function store(audio: Audio) {
    stored = audio;
    publish();
  }

  void loadAudio().then(store);
  onAudio(store);
  for (const flag of ["gainControl", "compressorControl"] as const) {
    watchFlag(flag, (on) => {
      features[flag] = on;
      publish();
    });
  }
}
