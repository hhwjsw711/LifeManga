import { useState } from "react";

export type GenerationPhase =
  | "idle"
  | "generatingScript"
  | "scriptReady"
  | "generatingImage"
  | "done";

export interface MangaPanel {
  description: string;
  dialogue?: string;
  dialogueJa?: string;
  narration?: string;
  narrationJa?: string;
  sfx?: string;
}

export interface StoryScript {
  title: string;
  synopsis: string;
  panels: MangaPanel[];
}

export interface GenerationState {
  phase: GenerationPhase;
  stageMessage: string;
  errorMessage: string | null;
  script: StoryScript | null;
}

export function useGenerationState() {
  return useState<GenerationState>({
    phase: "idle",
    stageMessage: "",
    errorMessage: null,
    script: null,
  });
}
