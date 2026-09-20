import { LAYOUT_LIBRARY, type LayoutType } from "./layoutTypes";
import { MIN_IMAGE_AREA_DESKTOP, PAGE_CONTENT } from "./layoutConfig";

export function estimatedSlotArea(slots: number) {
  const pageArea = PAGE_CONTENT.width * PAGE_CONTENT.height * PAGE_CONTENT.usable;
  return pageArea / Math.max(slots, 1);
}

export function layoutMeetsSizeThreshold(
  slots: number,
  minimum = MIN_IMAGE_AREA_DESKTOP,
) {
  return estimatedSlotArea(slots) >= minimum;
}

export function scoreLayoutQuality(options: {
  slots: number;
  orientationFit: number;
  hasHero: boolean;
  landscapeCount: number;
}): number {
  const { slots, orientationFit, hasHero, landscapeCount } = options;
  let score = orientationFit;

  if (slots === 1) score += 28;
  else if (slots === 2) score += 18;
  else if (slots === 3) score += 4;
  else score -= 16;

  score += Math.min(24, estimatedSlotArea(slots) / 8000);

  if (hasHero && slots === 1) score += 22;
  if (hasHero && slots > 2) score -= 40;

  if (landscapeCount >= 3 && slots >= 3) score -= 14;
  if (landscapeCount >= 4) score -= 24;

  return score;
}

export function layoutMayAppearSmall(layoutType: LayoutType, imageCount: number) {
  const slots = Math.max(LAYOUT_LIBRARY[layoutType]?.slots ?? imageCount, imageCount);
  return slots >= 4 || !layoutMeetsSizeThreshold(slots);
}

export function layoutDensityWarning(layoutType: LayoutType, imageCount: number) {
  if (!layoutMayAppearSmall(layoutType, imageCount)) return null;
  return "These images may appear small on this page. Consider using 1 or 2 photographs instead.";
}

export function layoutForImageCount(count: number, current?: string): LayoutType {
  const currentType = current as LayoutType | undefined;
  const currentSlots = currentType ? LAYOUT_LIBRARY[currentType]?.slots : undefined;
  if (count <= 1) {
    if (currentSlots === 1 && currentType) return currentType;
    return "HERO_PORTRAIT";
  }
  if (count === 2) {
    if (currentSlots === 2 && currentType) return currentType;
    return "TWO_PORTRAITS";
  }
  if (count === 3) {
    if (currentSlots === 3 && currentType) return currentType;
    return "THREE_PORTRAITS";
  }
  if (currentSlots && currentSlots >= 4 && currentType) return currentType;
  return "FOUR_PORTRAITS";
}
