export function buildBubbleDirective(mode: string | undefined): string {
  if (mode === "chinese")
    return "Render simplified Chinese dialogue in speech bubbles (≤12 characters per bubble). Also add Japanese kana ruby text above Chinese characters where appropriate.";
  if (mode === "japanese")
    return "Render hiragana/katakana in speech bubbles (≤8 kana per bubble).";
  if (mode === "english") return "Render English dialogue in speech bubbles.";
  if (mode === "empty")
    return "Draw speech bubbles but leave them blank (empty).";
  if (mode === "none")
    return "Do NOT draw any speech bubbles or caption boxes at all. Pure visual storytelling only.";
  return "";
}

export function buildColorDirective(isColor: boolean): string {
  return isColor
    ? "Render in FULL COLOR with vibrant manga coloring."
    : "Render in BLACK AND WHITE only, clean ink lines, no color, screentone shading only.";
}

export const CLEAN_INK_RULE =
  "CRITICAL CLEAN INK RULE: Draw with crisp, confident ink lines. No sketchy/pencil-like marks. All shapes must have clean closed outlines. Apply professional screentone dot patterns for shading — never raw pencil shading or smudging.";

export const DEFAULT_BUBBLE_MODE = "chinese";
export const DEFAULT_SCRIPT_MODEL = "gpt-4o-mini";
export const DEFAULT_IMAGE_SIZE = "1024x1536";
export const DEFAULT_IMAGE_QUALITY = "medium";
export const STALE_THRESHOLD_MS = 30 * 60 * 1000;
export const DEDUP_WINDOW_MS = 60 * 1000;
