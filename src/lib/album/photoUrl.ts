export const ALBUM_PHOTO_QUALITY = 70;
export const ALBUM_PHOTO_WIDTHS = [828, 1200, 1600] as const;
export const ALBUM_PHOTO_PREFETCH_WIDTH = 1200;

function rawPhotoUrl(photo: { thumbnailUrl?: string | null; url?: string }) {
  return photo.thumbnailUrl || photo.url || "";
}

export function optimizedPhotoUrl(
  url: string,
  width: number = ALBUM_PHOTO_PREFETCH_WIDTH,
  quality = ALBUM_PHOTO_QUALITY,
) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/_next/image")) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}

export function albumPhotoSrc(
  photo: { thumbnailUrl?: string | null; url?: string },
  width: number = ALBUM_PHOTO_PREFETCH_WIDTH,
) {
  return optimizedPhotoUrl(rawPhotoUrl(photo), width);
}

export function albumPhotoSrcSet(photo: { thumbnailUrl?: string | null; url?: string }) {
  const raw = rawPhotoUrl(photo);
  if (!raw) return undefined;
  return ALBUM_PHOTO_WIDTHS.map((width) => `${optimizedPhotoUrl(raw, width)} ${width}w`).join(", ");
}

export function prefetchAlbumPhoto(photo: { thumbnailUrl?: string | null; url?: string }) {
  const src = albumPhotoSrc(photo, ALBUM_PHOTO_PREFETCH_WIDTH);
  if (!src || typeof window === "undefined") return;
  const image = new window.Image();
  image.decoding = "async";
  image.src = src;
}
