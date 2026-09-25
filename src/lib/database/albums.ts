import { prisma } from "./client";
import { ALBUM_STATUS } from "../constants";
import { parseImageIds, serializeImageIds } from "../utils";
import { generateAlbumPages, type EnginePhoto } from "../album/generateAlbumPages";
import type { LayoutType } from "../album/layoutTypes";
import { deletePhotoFile, localUploadDir } from "../blob/storage";
import { readdir, unlink } from "fs/promises";
import path from "path";
import { ensureDefaultSections } from "./sections";
import { syncPublishedAlbumFromDraft } from "./syncPublished";

export async function getAlbumByStatus(status: string) {
  return prisma.album.findFirst({
    where: { status },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
        include: { section: true },
      },
    },
    orderBy: { version: "desc" },
  });
}

export async function getLatestDraft() {
  return getAlbumByStatus(ALBUM_STATUS.DRAFT);
}

export async function getPublishedAlbum() {
  return getAlbumByStatus(ALBUM_STATUS.PUBLISHED);
}

export async function resetAlbumWithoutPhotos() {
  await ensureDefaultSections();

  const photos = await prisma.photo.findMany();
  for (const photo of photos) {
    await deletePhotoFile(photo.blobUrl);
  }
  await prisma.photo.deleteMany();
  try {
    const files = await readdir(localUploadDir());
    await Promise.all(files.map((file) => unlink(path.join(localUploadDir(), file)).catch(() => undefined)));
  } catch {
    /* no local uploads folder */
  }
  await prisma.album.deleteMany();

  const draft = await prisma.album.create({
    data: {
      status: ALBUM_STATUS.DRAFT,
      version: 1,
      coverPhotoId: null,
      closingPhotoId: null,
    },
  });

  await prisma.album.create({
    data: {
      status: ALBUM_STATUS.PUBLISHED,
      version: 1,
      coverPhotoId: null,
      closingPhotoId: null,
      notes: `Empty two-part album from draft ${draft.id}`,
    },
  });

  return getLatestDraft();
}

function toEnginePhoto(photo: {
  id: string;
  width: number;
  height: number;
  orientation: string;
  aspectRatio: number;
  isHero?: boolean;
}): EnginePhoto {
  return {
    id: photo.id,
    width: photo.width,
    height: photo.height,
    orientation: photo.orientation as EnginePhoto["orientation"],
    aspectRatio: photo.aspectRatio,
    isHero: Boolean(photo.isHero),
  };
}

export async function generateDraftAlbum(options: {
  overwriteManual?: boolean;
  coverPhotoId?: string | null;
  closingPhotoId?: string | null;
}) {
  const sections = await prisma.section.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  const existingDraft = await getLatestDraft();
  const lockedPages =
    options.overwriteManual || !existingDraft
      ? []
      : existingDraft.pages.filter((page) => page.isManuallyEdited);

  const lockedIds = new Set(lockedPages.flatMap((page) => parseImageIds(page.imageIds)));

  const created = await prisma.album.create({
    data: {
      status: ALBUM_STATUS.DRAFT,
      version: (existingDraft?.version ?? 0) + 1,
      coverPhotoId: options.coverPhotoId ?? existingDraft?.coverPhotoId ?? sections[0]?.photos[0]?.id,
      closingPhotoId:
        options.closingPhotoId ??
        existingDraft?.closingPhotoId ??
        sections.at(-1)?.photos.at(-1)?.id,
    },
  });

  let pageNumber = 1;
  const createdPages = [];

  for (const section of sections) {
    const unlocked = section.photos.filter((photo) => !lockedIds.has(photo.id));
    const generated = generateAlbumPages(unlocked.map(toEnginePhoto), {
      section: section.slug === "wedding-day" ? "FUNCTION" : "WEDDING_SHOOT",
      startPageNumber: pageNumber,
    });

    const sectionLocked = lockedPages.filter((page) => page.sectionId === section.id);
    const merged = mergeLockedPages(
      generated.map((page) => ({
        ...page,
        sectionId: section.id,
      })),
      sectionLocked.map((page) => ({
        pageNumber: page.pageNumber,
        section: page.section?.slug ?? section.slug,
        layout: page.layoutType as LayoutType,
        images: parseImageIds(page.imageIds).map((id) => ({
          id,
          width: 1,
          height: 1,
          orientation: "PORTRAIT" as const,
          aspectRatio: 1,
        })),
        sectionId: section.id,
        caption: page.caption,
        showPageNumber: page.showPageNumber,
        isManuallyEdited: true,
      })),
    );

    for (const page of merged) {
      const extra = page as {
        caption?: string | null;
        showPageNumber?: boolean;
        isManuallyEdited?: boolean;
      };
      const record = await prisma.albumPage.create({
        data: {
          albumId: created.id,
          sectionId: page.sectionId,
          pageNumber,
          layoutType: page.layout,
          imageIds: serializeImageIds(page.images.map((image) => image.id)),
          caption: extra.caption ?? null,
          showPageNumber: extra.showPageNumber ?? true,
          isManuallyEdited: extra.isManuallyEdited ?? false,
        },
      });
      createdPages.push(record);
      pageNumber += 1;
    }
  }

  return prisma.album.findUnique({
    where: { id: created.id },
    include: { pages: { orderBy: { pageNumber: "asc" }, include: { section: true } } },
  });
}

function mergeLockedPages<T extends { images: { id: string }[]; layout: LayoutType; section: string }>(
  generated: Array<T & { sectionId: string }>,
  locked: Array<
    T & {
      sectionId: string;
      caption?: string | null;
      showPageNumber?: boolean;
      isManuallyEdited?: boolean;
    }
  >,
) {
  if (!locked.length) return generated;
  const lockedIds = new Set(locked.flatMap((page) => page.images.map((image) => image.id)));
  const filtered = generated.filter(
    (page) => !page.images.some((image) => lockedIds.has(image.id)),
  );
  return [...locked, ...filtered];
}

export async function publishAlbum(draftId?: string) {
  const draft = draftId
    ? await prisma.album.findUnique({
        where: { id: draftId },
        include: { pages: { orderBy: { pageNumber: "asc" } } },
      })
    : await getLatestDraft();

  if (!draft) {
    throw new Error("No draft album to publish.");
  }

  const existing = await getPublishedAlbum();
  if (existing) {
    await syncPublishedAlbumFromDraft(draft.id);
    return getPublishedAlbum();
  }

  return prisma.album.create({
    data: {
      status: ALBUM_STATUS.PUBLISHED,
      version: draft.version,
      coverPhotoId: draft.coverPhotoId,
      closingPhotoId: draft.closingPhotoId,
      notes: `Published from draft ${draft.id}`,
      pages: {
        create: draft.pages.map((page) => ({
          sectionId: page.sectionId,
          pageNumber: page.pageNumber,
          layoutType: page.layoutType,
          imageIds: page.imageIds,
          caption: page.caption,
          showPageNumber: page.showPageNumber,
          isManuallyEdited: page.isManuallyEdited,
        })),
      },
    },
    include: { pages: { orderBy: { pageNumber: "asc" }, include: { section: true } } },
  });
}
