import { prisma } from "./client";
import { parseImageIds, serializeImageIds } from "../utils";
import { layoutForImageCount } from "../album/layoutQuality";
import { LAYOUT_LIBRARY, type LayoutType } from "../album/layoutTypes";
import { padImageSlots } from "../album/bookPageNumbers";
import type { BookPageType } from "./book";
import { assembleBook } from "./book";
import { deletePhotoRecord } from "./photos";

export async function updatePage(
  id: string,
  data: {
    layoutType?: string;
    imageIds?: string[];
    caption?: string | null;
    showPageNumber?: boolean;
    sectionId?: string | null;
    isManuallyEdited?: boolean;
  },
) {
  const page = await prisma.albumPage.update({
    where: { id },
    data: {
      layoutType: data.layoutType,
      imageIds: data.imageIds ? serializeImageIds(data.imageIds) : undefined,
      caption: data.caption,
      showPageNumber: data.showPageNumber,
      sectionId: data.sectionId,
      isManuallyEdited: data.isManuallyEdited ?? true,
    },
  });
  return page;
}

export async function reorderPages(albumId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.albumPage.update({
        where: { id },
        data: { pageNumber: index + 1, isManuallyEdited: true },
      }),
    ),
  );
  return assembleBook(albumId);
}

export async function movePhotoPage(pageId: string, direction: "up" | "down") {
  const page = await prisma.albumPage.findUnique({ where: { id: pageId } });
  if (!page) return null;

  const siblings = await prisma.albumPage.findMany({
    where: { albumId: page.albumId, sectionId: page.sectionId },
    orderBy: { pageNumber: "asc" },
  });
  const index = siblings.findIndex((item) => item.id === page.id);
  const swapWith = direction === "up" ? siblings[index - 1] : siblings[index + 1];
  if (index < 0 || !swapWith) {
    return assembleBook(page.albumId);
  }

  await prisma.$transaction([
    prisma.albumPage.update({
      where: { id: page.id },
      data: { pageNumber: swapWith.pageNumber, isManuallyEdited: true },
    }),
    prisma.albumPage.update({
      where: { id: swapWith.id },
      data: { pageNumber: page.pageNumber, isManuallyEdited: true },
    }),
  ]);
  return assembleBook(page.albumId);
}

export function pageImageIds(imageIds: string) {
  return parseImageIds(imageIds);
}

async function resolveSectionId(sectionId?: string | null) {
  if (sectionId) return sectionId;
  const first = await prisma.section.findFirst({ orderBy: { sortOrder: "asc" } });
  return first?.id ?? null;
}

async function insertPhotoPage(options: {
  albumId: string;
  sectionId: string | null;
  pageNumber: number;
  photoIds: string[];
}) {
  const { albumId, sectionId, pageNumber, photoIds } = options;
  await prisma.albumPage.updateMany({
    where: { albumId, pageNumber: { gte: pageNumber } },
    data: { pageNumber: { increment: 1 } },
  });
  return prisma.albumPage.create({
    data: {
      albumId,
      sectionId,
      pageNumber,
      layoutType: layoutForImageCount(photoIds.length),
      imageIds: serializeImageIds(photoIds),
      isManuallyEdited: true,
    },
  });
}

export async function attachPhotosToBook(options: {
  albumId: string;
  pageId: string;
  pageType: BookPageType | string;
  sectionId?: string | null;
  photoIds: string[];
  slotIndex?: number;
}) {
  const { albumId, pageId, pageType, photoIds, slotIndex } = options;
  if (!photoIds.length) {
    return assembleBook(albumId);
  }

  if (pageType === "COVER") {
    await prisma.album.update({
      where: { id: albumId },
      data: { coverPhotoId: photoIds[0] },
    });
    return assembleBook(albumId);
  }

  if (pageType === "CLOSING") {
    await prisma.album.update({
      where: { id: albumId },
      data: { closingPhotoId: photoIds[0] },
    });
    return assembleBook(albumId);
  }

  if (pageType !== "PHOTO") {
    return assembleBook(albumId);
  }

  const target = await prisma.albumPage.findUnique({ where: { id: pageId } });
  if (!target) {
    return assembleBook(albumId);
  }
  const slots = LAYOUT_LIBRARY[target.layoutType as LayoutType]?.slots ?? 4;
  const current = parseImageIds(target.imageIds);
  const next = padImageSlots(current, slots);
  let cursor =
    typeof slotIndex === "number" && slotIndex >= 0
      ? Math.min(slotIndex, slots - 1)
      : Math.max(0, next.findIndex((id) => !id));
  if (cursor < 0) cursor = 0;

  for (const id of photoIds) {
    while (cursor < slots && next[cursor]) cursor += 1;
    if (cursor >= slots) break;
    next[cursor] = id;
    cursor += 1;
  }

  await updatePage(target.id, {
    imageIds: next,
    layoutType: target.layoutType,
    isManuallyEdited: true,
  });
  return assembleBook(albumId);
}

export async function removePhotoFromBook(albumId: string, photoId: string) {
  await deletePhotoRecord(photoId);
  return assembleBook(albumId);
}

export async function createEmptyPhotoPage(options: {
  albumId: string;
  sectionId?: string | null;
  afterPageNumber?: number;
  layoutType?: string;
}) {
  const sectionId = await resolveSectionId(options.sectionId);
  let insertAt: number;

  if (typeof options.afterPageNumber === "number") {
    insertAt = options.afterPageNumber + 1;
  } else {
    const lastInSection = await prisma.albumPage.findFirst({
      where: { albumId: options.albumId, sectionId },
      orderBy: { pageNumber: "desc" },
    });
    if (lastInSection) {
      insertAt = lastInSection.pageNumber + 1;
    } else {
      const section = sectionId ? await prisma.section.findUnique({ where: { id: sectionId } }) : null;
      const earlier = await prisma.section.findMany({
        where: { sortOrder: { lt: section?.sortOrder ?? 0 } },
        select: { id: true },
      });
      const lastEarlier = earlier.length
        ? await prisma.albumPage.findFirst({
            where: { albumId: options.albumId, sectionId: { in: earlier.map((item) => item.id) } },
            orderBy: { pageNumber: "desc" },
          })
        : null;
      insertAt = (lastEarlier?.pageNumber ?? 0) + 1;
    }
  }

  const page = await insertPhotoPage({
    albumId: options.albumId,
    sectionId,
    pageNumber: insertAt,
    photoIds: [],
  });

  if (options.layoutType) {
    await prisma.albumPage.update({
      where: { id: page.id },
      data: { layoutType: options.layoutType, imageIds: serializeImageIds([""]), isManuallyEdited: true },
    });
  }

  return assembleBook(options.albumId);
}

export async function deletePhotoPage(pageId: string) {
  const page = await prisma.albumPage.findUnique({ where: { id: pageId } });
  if (!page) return null;

  await prisma.albumPage.delete({ where: { id: pageId } });
  await prisma.albumPage.updateMany({
    where: { albumId: page.albumId, pageNumber: { gt: page.pageNumber } },
    data: { pageNumber: { decrement: 1 } },
  });
  return assembleBook(page.albumId);
}
