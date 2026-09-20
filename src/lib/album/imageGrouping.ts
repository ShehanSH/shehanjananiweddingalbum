import type { EnginePhoto } from "./layoutTypes";

export function countUpcoming(
  photos: EnginePhoto[],
  limit = 4,
): { portraits: number; landscapes: number; squares: number; total: number } {
  const slice = photos.slice(0, limit);
  return {
    portraits: slice.filter((p) => p.orientation === "PORTRAIT").length,
    landscapes: slice.filter((p) => p.orientation === "LANDSCAPE").length,
    squares: slice.filter((p) => p.orientation === "SQUARE").length,
    total: slice.length,
  };
}

export function consecutiveOrientationRun(photos: EnginePhoto[]): {
  orientation: EnginePhoto["orientation"];
  count: number;
} {
  if (!photos.length) {
    return { orientation: "PORTRAIT", count: 0 };
  }
  const first = photos[0].orientation;
  let count = 1;
  for (let i = 1; i < photos.length; i += 1) {
    if (photos[i].orientation !== first) break;
    count += 1;
  }
  return { orientation: first, count };
}

export function takePhotos(photos: EnginePhoto[], count: number): EnginePhoto[] {
  return photos.slice(0, Math.max(0, count));
}
