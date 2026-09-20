import { AlbumBook } from "@/components/album/AlbumBook";
import { parseAlbumStartPage, type AlbumSearchParams } from "@/lib/album/pagePosition";
import { loadAlbumBook } from "@/lib/database/loadAlbum";
import { isAdminAuthenticated } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AlbumPage({
  searchParams,
}: {
  searchParams: Promise<AlbumSearchParams>;
}) {
  const params = await searchParams;
  const authed = await isAdminAuthenticated();
  const preview = params.preview === "1" && authed;
  const { album, pages } = await loadAlbumBook(preview);
  return (
    <AlbumBook
      pages={pages}
      albumId={album?.id}
      editable={authed}
      startAt={parseAlbumStartPage(params.page, pages.length)}
    />
  );
}
