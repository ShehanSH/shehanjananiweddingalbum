import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { ensureDefaultSections } from "@/lib/database/sections";
import { getLatestDraft, getPublishedAlbum } from "@/lib/database/albums";

export async function GET() {
  await ensureDefaultSections();
  const [photos, sections, draft, published] = await Promise.all([
    prisma.photo.findMany({ include: { section: true } }),
    prisma.section.findMany({ orderBy: { sortOrder: "asc" } }),
    getLatestDraft(),
    getPublishedAlbum(),
  ]);

  return NextResponse.json({
    totalPhotos: photos.length,
    weddingShootPhotos: photos.filter((photo) => photo.section.slug === "wedding-shoot").length,
    weddingDayPhotos: photos.filter((photo) => photo.section.slug === "wedding-day").length,
    totalPages: (published ?? draft)?.pages.length ?? 0,
    draftPages: draft?.pages.length ?? 0,
    publishedPages: published?.pages.length ?? 0,
    sections,
  });
}
