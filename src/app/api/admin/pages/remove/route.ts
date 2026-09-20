import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { removePhotoFromBook } from "@/lib/database/pages";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const albumId = String(body.albumId || "");
  const photoId = String(body.photoId || "");

  if (!albumId || !photoId) {
    return NextResponse.json({ error: "albumId and photoId are required." }, { status: 400 });
  }

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album) {
    return NextResponse.json({ error: "Album not found." }, { status: 404 });
  }

  const pages = await removePhotoFromBook(albumId, photoId);
  return NextResponse.json({ pages });
}
