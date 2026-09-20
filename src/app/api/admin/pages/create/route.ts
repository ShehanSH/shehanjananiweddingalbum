import { NextResponse } from "next/server";
import { createEmptyPhotoPage } from "@/lib/database/pages";
import { prisma } from "@/lib/database/client";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const albumId = String(body.albumId || "");
  if (!albumId) {
    return NextResponse.json({ error: "albumId is required." }, { status: 400 });
  }

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album) {
    return NextResponse.json({ error: "Album not found." }, { status: 404 });
  }

  const pages = await createEmptyPhotoPage({
    albumId,
    sectionId: body.sectionId ?? null,
    afterPageNumber: typeof body.afterPageNumber === "number" ? body.afterPageNumber : undefined,
    layoutType: typeof body.layoutType === "string" ? body.layoutType : "HERO_PORTRAIT",
  });

  return NextResponse.json({ pages });
}
