export const CASE_HERO_WIDTHS = [480, 768, 960, 1536] as const;
export const CASE_THUMB_WIDTHS = [360, 560, 768, 960] as const;
export const CASE_HERO_QUALITY = 45;
export const CASE_COVER_QUALITY = 72;

export function renditionWidthsFor(
  imageWidth: number,
  candidates: readonly number[],
): number[] {
  const widths = candidates.filter((width) => width <= imageWidth);
  const largestCandidate = candidates.at(-1);
  if (
    largestCandidate !== undefined &&
    imageWidth < largestCandidate &&
    !widths.includes(imageWidth)
  ) {
    widths.push(imageWidth);
  }
  return widths.length > 0 ? widths : [imageWidth];
}

export function caseHeroWidthsFor(imageWidth: number): number[] {
  return renditionWidthsFor(imageWidth, CASE_HERO_WIDTHS);
}

export function caseThumbWidthsFor(imageWidth: number): number[] {
  return renditionWidthsFor(imageWidth, CASE_THUMB_WIDTHS);
}
