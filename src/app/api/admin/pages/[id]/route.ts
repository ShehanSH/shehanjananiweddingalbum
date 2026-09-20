import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { assembleBook } from "@/lib/database/book";
import { syncPublishedAlbumFromDraft } from "@/lib/database/syncPublished";
import { updatePage, reorderPages } from "@/lib/database/pages";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  const page = await updatePage(id, body);
  return NextResponse.json(page);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const page = await prisma.albumPage.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  await prisma.albumPage.delete({ where: { id } });
  await prisma.albumPage.updateMany({
    where: { albumId: page.albumId, pageNumber: { gt: page.pageNumber } },
    data: { pageNumber: { decrement: 1 } },
  });
  await syncPublishedAlbumFromDraft(page.albumId);
  const pages = await assembleBook(page.albumId);
  return NextResponse.json({ pages });
}

export async function PUT(request: Request) {
  const body = await request.json();
  if (!body.albumId || !Array.isArray(body.orderedIds)) {
    return NextResponse.json({ error: "albumId and orderedIds required" }, { status: 400 });
  }
  const pages = await reorderPages(body.albumId, body.orderedIds);
  return NextResponse.json(pages);
}
