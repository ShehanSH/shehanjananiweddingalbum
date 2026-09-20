import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { deletePhotoRecord } from "@/lib/database/photos";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  const photo = await prisma.photo.update({
    where: { id },
    data: {
      caption: body.caption,
      sectionId: body.sectionId,
      sortOrder: body.sortOrder,
      isHero: typeof body.isHero === "boolean" ? body.isHero : undefined,
      offsetX: typeof body.offsetX === "number" ? body.offsetX : undefined,
      offsetY: typeof body.offsetY === "number" ? body.offsetY : undefined,
      scale: typeof body.scale === "number" ? body.scale : undefined,
    },
    include: { section: true },
  });
  return NextResponse.json(photo);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const deleted = await deletePhotoRecord(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
