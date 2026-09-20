export type AlbumSearchParams = {
  preview?: string;
  page?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAlbumStartPage(
  pageParam: string | string[] | undefined,
  pageCount: number,
  fallback = 0,
) {
  const last = Math.max(pageCount - 1, 0);
  const fallbackIndex = Math.min(Math.max(fallback, 0), last);
  const page = Math.floor(Number(firstParam(pageParam)));
  if (!Number.isFinite(page) || page < 1) return fallbackIndex;
  return Math.min(page - 1, last);
}

export function albumDisplayPage(pageIndex: number, opened: boolean) {
  return opened ? pageIndex + 1 : 1;
}

export function persistAlbumPageInUrl(displayPage: number) {
  if (typeof window === "undefined" || displayPage < 1) return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("page") === String(displayPage)) return;
  url.searchParams.set("page", String(displayPage));
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
