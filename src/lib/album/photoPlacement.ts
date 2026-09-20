export const MIN_PHOTO_SCALE = 0.7;
export const MAX_PHOTO_SCALE = 3;
export const MAX_PHOTO_OFFSET = 48;

export type PhotoPlacement = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampPlacement(placement: PhotoPlacement): PhotoPlacement {
  const scale = clampNumber(placement.scale, MIN_PHOTO_SCALE, MAX_PHOTO_SCALE);
  const limit = MAX_PHOTO_OFFSET * Math.max(scale, 1);
  return {
    offsetX: clampNumber(placement.offsetX, -limit, limit),
    offsetY: clampNumber(placement.offsetY, -limit, limit),
    scale,
  };
}

export function normalizePlacement(value?: Partial<PhotoPlacement> | null): PhotoPlacement {
  return clampPlacement({
    offsetX: Number(value?.offsetX) || 0,
    offsetY: Number(value?.offsetY) || 0,
    scale: Number(value?.scale) || 1,
  });
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

export function isAlbumInteractTarget(target: EventTarget | null) {
  return Boolean(target instanceof Element && target.closest("[data-album-interact]"));
}
