import { prisma } from "./client";
import { parseImageIds, serializeImageIds } from "../utils";
import { deletePhotoFile } from "../blob/storage";

export async function listPhotos(sectionId?: string) {
  return prisma.photo.findMany({
    where: sectionId ? { sectionId } : undefined,
    include: { section: true },
    orderBy: [{ section: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getPhoto(id: string) {
  return prisma.photo.findUnique({ where: { id }, include: { section: true } });
}

export async function nextSortOrder(sectionId: string) {
  const last = await prisma.photo.findFirst({
    where: { sectionId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? 0) + 1;
}

export async function reorderPhotos(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.photo.update({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
}

export async function photosUsedInAlbums(photoId: string) {
  const pages = await prisma.albumPage.findMany({ select: { imageIds: true } });
  return pages.some((page) => parseImageIds(page.imageIds).includes(photoId));
}

export async function unlinkPhotoFromAlbums(photoId: string) {
  const pages = await prisma.albumPage.findMany({
    select: { id: true, imageIds: true },
  });

  for (const page of pages) {
    const ids = parseImageIds(page.imageIds);
    if (!ids.includes(photoId)) continue;
    const next = ids.map((id) => (id === photoId ? "" : id));
    await prisma.albumPage.update({
      where: { id: page.id },
      data: {
        imageIds: serializeImageIds(next),
        isManuallyEdited: true,
      },
    });
  }

  await prisma.album.updateMany({
    where: { coverPhotoId: photoId },
    data: { coverPhotoId: null },
  });
  await prisma.album.updateMany({
    where: { closingPhotoId: photoId },
    data: { closingPhotoId: null },
  });
}

export async function deletePhotoRecord(photoId: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return false;
  await unlinkPhotoFromAlbums(photoId);
  await prisma.photo.delete({ where: { id: photoId } });
  await deletePhotoFile(photo.blobUrl);
  return true;
}
