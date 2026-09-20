import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { listPhotos, reorderPhotos } from "@/lib/database/photos";
import { ensureDefaultSections } from "@/lib/database/sections";

export async function GET() {
  await ensureDefaultSections();
  const photos = await listPhotos();
  return NextResponse.json(photos);
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
