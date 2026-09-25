import { assembleBook } from "./book";
import { getLatestDraft, getPublishedAlbum } from "./albums";

export async function loadAlbumBook(preview = false) {
  const album = preview
    ? ((await getLatestDraft()) ?? (await getPublishedAlbum()))
    : await getPublishedAlbum();
  if (!album) return { album: null, pages: [] };
  const pages = await assembleBook(album.id);
  return { album, pages };
}
