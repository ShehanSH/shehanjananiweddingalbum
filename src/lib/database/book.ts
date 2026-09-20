import { prisma } from "./client";
import { parseImageIds } from "../utils";
import type { LayoutType } from "../album/layoutTypes";
import { COUPLE, INTRO_COPY } from "../constants";

export type BookPageType =
  | "COVER"
  | "INTRODUCTION"
  | "SECTION_INTRO"
  | "PHOTO"
  | "CLOSING";

export interface BookPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  orientation: string;
  caption: string | null;
  filename: string;
  alt: string;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface BookPage {
  id: string;
  type: BookPageType;
  pageNumber: number;
  editorialPageNumber?: number;
  layoutType?: LayoutType;
  sectionId?: string | null;
  sectionSlug?: string | null;
  sectionTitle?: string | null;
  sectionSubtitle?: string | null;
  sectionDescription?: string | null;
  caption?: string | null;
  showPageNumber: boolean;
  isManuallyEdited?: boolean;
  images: Array<BookPhoto | null>;
  title?: string;
  body?: string;
}

function toBookPhoto(photo: {
  id: string;
  blobUrl: string;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  orientation: string;
  caption: string | null;
  filename: string;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}): BookPhoto {
  return {
    id: photo.id,
    url: photo.blobUrl,
    thumbnailUrl: photo.thumbnailUrl || photo.blobUrl,
    width: photo.width,
    height: photo.height,
    orientation: photo.orientation,
    caption: photo.caption,
    filename: photo.filename,
    alt: photo.caption || `Wedding photograph of ${COUPLE.groom} and ${COUPLE.bride}`,
    offsetX: Number(photo.offsetX) || 0,
    offsetY: Number(photo.offsetY) || 0,
    scale: Number(photo.scale) || 1,
  };
}

export async function assembleBook(albumId: string): Promise<BookPage[]> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
        include: { section: true },
      },
    },
  });

  if (!album) return [];

  const photos = await prisma.photo.findMany();
  const photoMap = new Map(photos.map((photo) => [photo.id, photo]));
  const cover = album.coverPhotoId ? photoMap.get(album.coverPhotoId) : undefined;
  const closing = album.closingPhotoId ? photoMap.get(album.closingPhotoId) : undefined;

  const book: BookPage[] = [
    {
      id: "cover",
      type: "COVER",
      pageNumber: 0,
      showPageNumber: false,
      images: cover ? [toBookPhoto(cover)] : [],
      title: `${COUPLE.groom} & ${COUPLE.bride}`,
    },
    {
      id: "introduction",
      type: "INTRODUCTION",
      pageNumber: 0,
      showPageNumber: false,
      images: [],
      body: INTRO_COPY.introduction,
    },
  ];

  const pagesBySection = new Map<string, typeof album.pages>();
  for (const page of album.pages) {
    const key = page.sectionId ?? "unsectioned";
    const list = pagesBySection.get(key) ?? [];
    list.push(page);
    pagesBySection.set(key, list);
  }

  const sections = await prisma.section.findMany({ orderBy: { sortOrder: "asc" } });

  for (const section of sections) {
    const sectionPages = pagesBySection.get(section.id) ?? [];

    book.push({
      id: `section-${section.id}`,
      type: "SECTION_INTRO",
      pageNumber: 0,
      showPageNumber: false,
      sectionId: section.id,
      sectionSlug: section.slug,
      sectionTitle: section.title,
      sectionSubtitle: section.subtitle,
      sectionDescription: section.description,
      images: [],
    });

    for (const page of sectionPages) {
      const images = parseImageIds(page.imageIds).map((id) => {
        if (!id) return null;
        const photo = photoMap.get(id);
        return photo ? toBookPhoto(photo) : null;
      });

      book.push({
        id: page.id,
        type: "PHOTO",
        pageNumber: page.pageNumber,
        editorialPageNumber: page.pageNumber,
        layoutType: page.layoutType as LayoutType,
        sectionId: page.sectionId,
        sectionSlug: page.section?.slug,
        sectionTitle: page.section?.title,
        caption: page.caption,
        showPageNumber: page.showPageNumber,
        isManuallyEdited: page.isManuallyEdited,
        images,
      });
    }
  }

  book.push({
    id: "closing",
    type: "CLOSING",
    pageNumber: 0,
    showPageNumber: false,
    images: closing ? [toBookPhoto(closing)] : [],
    body: INTRO_COPY.closing,
  });

  return book.map((page, index) => ({ ...page, pageNumber: index + 1 }));
}
