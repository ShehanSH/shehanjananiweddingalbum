import { prisma } from "./client";
import { ALBUM_STATUS } from "../constants";

export async function syncPublishedAlbumFromDraft(draftAlbumId: string) {
  const draft = await prisma.album.findUnique({
    where: { id: draftAlbumId },
    include: { pages: { orderBy: { pageNumber: "asc" } } },
  });
  if (!draft || draft.status !== ALBUM_STATUS.DRAFT) return;

  const published = await prisma.album.findFirst({
    where: { status: ALBUM_STATUS.PUBLISHED },
    orderBy: { version: "desc" },
  });
  if (!published || published.id === draft.id) return;

  await prisma.$transaction(async (tx) => {
    await tx.albumPage.deleteMany({ where: { albumId: published.id } });
    if (draft.pages.length) {
      await tx.albumPage.createMany({
        data: draft.pages.map((page) => ({
          albumId: published.id,
          sectionId: page.sectionId,
          pageNumber: page.pageNumber,
          layoutType: page.layoutType,
          imageIds: page.imageIds,
          caption: page.caption,
          showPageNumber: page.showPageNumber,
          isManuallyEdited: true,
        })),
      });
    }
    await tx.album.update({
      where: { id: published.id },
      data: {
        coverPhotoId: draft.coverPhotoId,
        closingPhotoId: draft.closingPhotoId,
      },
    });
  });
}
