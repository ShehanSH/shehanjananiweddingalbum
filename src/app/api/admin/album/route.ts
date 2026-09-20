import { NextResponse } from "next/server";
import { generateDraftAlbum, getLatestDraft, getPublishedAlbum, publishAlbum, resetAlbumWithoutPhotos } from "@/lib/database/albums";
import { assembleBook } from "@/lib/database/book";
import { prisma } from "@/lib/database/client";

export async function GET() {
  const [draft, published] = await Promise.all([getLatestDraft(), getPublishedAlbum()]);
  const book = draft ? await assembleBook(draft.id) : [];
  return NextResponse.json({ draft, published, book });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "");

  if (action === "clear-images") {
    const album = await resetAlbumWithoutPhotos();
    return NextResponse.json(album);
  }

  if (action === "generate" || action === "regenerate") {
    const album = await generateDraftAlbum({
      overwriteManual: Boolean(body.overwriteManual),
      coverPhotoId: body.coverPhotoId,
      closingPhotoId: body.closingPhotoId,
    });
    return NextResponse.json(album);
  }

  if (action === "publish") {
    const album = await publishAlbum(body.draftId);
    return NextResponse.json(album);
  }

  if (action === "cover") {
    const draft = await getLatestDraft();
    if (!draft) {
      return NextResponse.json({ error: "No draft album." }, { status: 400 });
    }

    const data = {
      coverPhotoId: body.coverPhotoId === undefined ? undefined : body.coverPhotoId,
      closingPhotoId: body.closingPhotoId === undefined ? undefined : body.closingPhotoId,
    };

    const updated = await prisma.album.update({
      where: { id: draft.id },
      data,
    });

    const published = await getPublishedAlbum();
    if (published) {
      await prisma.album.update({
        where: { id: published.id },
        data,
      });
    }

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
