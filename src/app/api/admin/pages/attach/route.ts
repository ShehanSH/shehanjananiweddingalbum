import { NextResponse } from "next/server";
import { attachPhotosToBook } from "@/lib/database/pages";
import { prisma } from "@/lib/database/client";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const albumId = String(body.albumId || "");
  const pageId = String(body.pageId || "");
  const pageType = String(body.pageType || "");
  const photoIds = Array.isArray(body.photoIds) ? body.photoIds.filter((id: unknown) => typeof id === "string") : [];

  if (!albumId || !pageType || !photoIds.length) {
    return NextResponse.json({ error: "albumId, pageType, and photoIds are required." }, { status: 400 });
  }

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album) {
    return NextResponse.json({ error: "Album not found." }, { status: 404 });
  }

  const pages = await attachPhotosToBook({
    albumId,
    pageId,
    pageType,
    sectionId: body.sectionId ?? null,
    photoIds,
    slotIndex: typeof body.slotIndex === "number" ? body.slotIndex : undefined,
  });

  return NextResponse.json({ pages });
}
