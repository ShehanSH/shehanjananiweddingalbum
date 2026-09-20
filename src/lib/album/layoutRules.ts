import {
  LAYOUT_LIBRARY,
  LANDSCAPE_RHYTHM,
  MIXED_RHYTHM,
  PORTRAIT_RHYTHM,
  type EnginePhoto,
  type LayoutDefinition,
  type LayoutType,
} from "./layoutTypes";
import { consecutiveOrientationRun, countUpcoming } from "./imageGrouping";
import { layoutMeetsSizeThreshold, scoreLayoutQuality } from "./layoutQuality";
import { spreadBalanceAdjustment } from "./spreadBalance";
import { MIN_IMAGE_AREA_DESKTOP } from "./layoutConfig";

const PORTRAIT_SECTIONS = new Set(["WEDDING_SHOOT", "PRE_WEDDING"]);
const LANDSCAPE_SECTIONS = new Set(["FUNCTION", "WEDDING_DAY", "RECEPTION"]);

function rhythmForSection(section: string, photos: EnginePhoto[]): LayoutType[] {
  const sample = photos.slice(0, Math.min(12, photos.length));
  const portraits = sample.filter((p) => p.orientation === "PORTRAIT").length;
  const landscapes = sample.filter((p) => p.orientation === "LANDSCAPE").length;

  if (PORTRAIT_SECTIONS.has(section) || portraits >= landscapes * 1.4) {
    return PORTRAIT_RHYTHM;
  }
  if (LANDSCAPE_SECTIONS.has(section) || landscapes >= portraits * 1.4) {
    return LANDSCAPE_RHYTHM;
  }
  return MIXED_RHYTHM;
}

function orientationMatchScore(layout: LayoutDefinition, photos: EnginePhoto[]): number {
  const used = photos.slice(0, layout.slots);
  if (used.length < 1) return -10000;

  let score = 0;
  for (let i = 0; i < used.length; i += 1) {
    const preferred = layout.preferred[i] ?? "ANY";
    const orientation = used[i].orientation;
    if (preferred === "ANY") {
      score += 4;
    } else if (preferred === orientation) {
      score += 10;
    } else if (orientation === "SQUARE") {
      score += 3;
    } else if (layout.allowMixed) {
      score += 1;
    } else {
      score -= 14;
    }
  }
  return score;
}

export function scoreLayout(
  layout: LayoutDefinition,
  remaining: EnginePhoto[],
  recent: LayoutType[],
  rhythmHint?: LayoutType,
  previousSlots = 0,
): number {
  if (remaining.length < layout.slots) return Number.NEGATIVE_INFINITY;
  if (!layoutMeetsSizeThreshold(layout.slots, MIN_IMAGE_AREA_DESKTOP)) {
    return Number.NEGATIVE_INFINITY;
  }

  const used = remaining.slice(0, layout.slots);
  const hasHero = used.some((photo) => photo.isHero);
  if (hasHero && layout.slots > 2) return Number.NEGATIVE_INFINITY;

  const landscapeCount = used.filter((photo) => photo.orientation === "LANDSCAPE").length;
  let score = scoreLayoutQuality({
    slots: layout.slots,
    orientationFit: orientationMatchScore(layout, remaining),
    hasHero,
    landscapeCount,
  });

  if (recent.includes(layout.type)) {
    score -= 16 * (recent.filter((item) => item === layout.type).length);
  }
  if (recent[recent.length - 1] === layout.type) {
    score -= 22;
  }
  if (rhythmHint === layout.type) {
    score += 14;
  }
  if (layout.family === "hero" && recent[recent.length - 1]?.includes("HERO")) {
    score -= 6;
  }

  score += spreadBalanceAdjustment(layout, previousSlots);
  return score;
}

export function selectLayout(
  remaining: EnginePhoto[],
  recent: LayoutType[],
  section: string,
  rhythmIndex = 0,
  previousSlots = 0,
): LayoutDefinition {
  if (remaining.length === 0) {
    return LAYOUT_LIBRARY.HERO_PORTRAIT;
  }

  const rhythm = rhythmForSection(section, remaining);
  const hint = rhythm[rhythmIndex % rhythm.length];
  const upcoming = countUpcoming(remaining);
  const run = consecutiveOrientationRun(remaining);
  const first = remaining[0];

  if (first.isHero || remaining.length === 1) {
    if (first.orientation === "LANDSCAPE") {
      return recent[recent.length - 1] === "HERO_LANDSCAPE"
        ? LAYOUT_LIBRARY.FULL_BLEED_IMAGE
        : LAYOUT_LIBRARY.HERO_LANDSCAPE;
    }
    if (recent[recent.length - 1] === "HERO_PORTRAIT") {
      return LAYOUT_LIBRARY.WHITE_SPACE_EDITORIAL;
    }
    return LAYOUT_LIBRARY.HERO_PORTRAIT;
  }

  if (recent.length === 0) {
    return first.orientation === "LANDSCAPE"
      ? LAYOUT_LIBRARY.HERO_LANDSCAPE
      : LAYOUT_LIBRARY.HERO_PORTRAIT;
  }

  const candidates = Object.values(LAYOUT_LIBRARY).filter(
    (layout) => layout.slots <= remaining.length,
  );

  let best = LAYOUT_LIBRARY.HERO_PORTRAIT;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const layout of candidates) {
    let score = scoreLayout(layout, remaining, recent, hint, previousSlots);

    if (run.orientation === "PORTRAIT" && run.count >= layout.slots && layout.family === "portrait") {
      score += 8;
    }
    if (run.orientation === "LANDSCAPE" && run.count >= layout.slots && layout.family === "landscape") {
      score += 8;
    }
    if (upcoming.landscapes > 0 && upcoming.portraits > 0 && layout.family === "mixed") {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      best = layout;
    }
  }

  if (bestScore === Number.NEGATIVE_INFINITY) {
    return first.orientation === "LANDSCAPE"
      ? LAYOUT_LIBRARY.HERO_LANDSCAPE
      : LAYOUT_LIBRARY.HERO_PORTRAIT;
  }

  return best;
}
