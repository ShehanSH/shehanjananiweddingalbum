export const PAGE_FLIP_DURATION = 1680;

export const MIN_IMAGE_AREA_DESKTOP = 72000;
export const MIN_IMAGE_AREA_TABLET = 56000;
export const MIN_IMAGE_AREA_MOBILE = 42000;

export const PAGE_CONTENT = {
  width: 520,
  height: 720,
  usable: 0.78,
} as const;

export const SPREAD_BREAKPOINT = 1024;
export const SWIPE_THRESHOLD = 56;
export const PAGE_EDGE_RATIO = 0.11;

export function minImageAreaForViewport(width: number) {
  if (width < 768) return MIN_IMAGE_AREA_MOBILE;
  if (width < SPREAD_BREAKPOINT) return MIN_IMAGE_AREA_TABLET;
  return MIN_IMAGE_AREA_DESKTOP;
}
