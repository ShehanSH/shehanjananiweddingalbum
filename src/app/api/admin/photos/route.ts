import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { createUploadedPhoto } from "@/lib/database/createUploadedPhoto";
import { listPhotos, reorderPhotos } from "@/lib/database/photos";
import { ensureDefaultSections } from "@/lib/database/sections";

export async function GET() {
  await ensureDefaultSections();
  const photos = await listPhotos();
  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.blobUrl || !body?.filename) {
      return NextResponse.json({ error: "Photograph URL and filename are required." }, { status: 400 });
    }
    const photo = await createUploadedPhoto({
      blobUrl: String(body.blobUrl),
      thumbnailUrl: body.thumbnailUrl ? String(body.thumbnailUrl) : String(body.blobUrl),
      filename: String(body.filename),
      width: Number(body.width || 0),
      height: Number(body.height || 0),
      sectionId: body.sectionId ? String(body.sectionId) : undefined,
      mimeType: body.mimeType ? String(body.mimeType) : "image/jpeg",
      fileSize: body.fileSize ? Number(body.fileSize) : null,
    });
    return NextResponse.json(photo);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Upload failed. Please retry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (Array.isArray(body?.orderedIds)) {
    await reorderPhotos(body.orderedIds);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
}

export async function PUT() {
  const photos = await prisma.photo.findMany();
  return NextResponse.json({ count: photos.length });
}
