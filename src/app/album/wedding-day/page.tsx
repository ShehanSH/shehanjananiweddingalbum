import { AlbumBook } from "@/components/album/AlbumBook";
import { parseAlbumStartPage, type AlbumSearchParams } from "@/lib/album/pagePosition";
import { loadAlbumBook } from "@/lib/database/loadAlbum";
import { isAdminAuthenticated } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function WeddingDayPage({
  searchParams,
}: {
  searchParams: Promise<AlbumSearchParams>;
}) {
  const params = await searchParams;
  const authed = await isAdminAuthenticated();
  const preview = params.preview === "1" && authed;
  const { album, pages } = await loadAlbumBook(preview);
  const sectionStart = Math.max(
    0,
    pages.findIndex((page) => page.sectionSlug === "wedding-day" && page.type === "SECTION_INTRO"),
  );
  return (
    <AlbumBook
      pages={pages}
      albumId={album?.id}
      editable={authed}
      startAt={parseAlbumStartPage(params.page, pages.length, sectionStart)}
    />
  );
}
