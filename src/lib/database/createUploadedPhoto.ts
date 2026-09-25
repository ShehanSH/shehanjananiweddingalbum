import { prisma } from "./client";
import { nextSortOrder } from "./photos";
import { getOrientation } from "../utils";
import { ensureDefaultSections } from "./sections";

export async function createUploadedPhoto(input: {
  blobUrl: string;
  thumbnailUrl?: string | null;
  filename: string;
  width: number;
  height: number;
  sectionId?: string;
  mimeType?: string | null;
  fileSize?: number | null;
}) {
  if (!input.width || !input.height) {
    throw new Error("Could not read photograph dimensions.");
  }

  await ensureDefaultSections();
  const sectionId = input.sectionId?.trim() || undefined;
  const section =
    (sectionId
      ? await prisma.section.findUnique({ where: { id: sectionId } })
      : await prisma.section.findFirst({ orderBy: { sortOrder: "asc" } }));
  if (!section) {
    throw new Error("No album section is available.");
  }

  return prisma.photo.create({
    data: {
      blobUrl: input.blobUrl,
      thumbnailUrl: input.thumbnailUrl || input.blobUrl,
      filename: input.filename,
      width: input.width,
      height: input.height,
      orientation: getOrientation(input.width, input.height),
      aspectRatio: input.width / input.height,
      fileSize: input.fileSize ?? null,
      mimeType: input.mimeType ?? null,
      sectionId: section.id,
      sortOrder: await nextSortOrder(section.id),
    },
    include: { section: true },
  });
}
