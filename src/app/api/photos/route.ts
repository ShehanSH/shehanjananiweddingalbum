import { NextResponse } from "next/server";
import { listPhotos } from "@/lib/database/photos";

export async function GET() {
  const photos = await listPhotos();
  return NextResponse.json(
    photos.map((photo) => ({
      id: photo.id,
      url: photo.thumbnailUrl || photo.blobUrl,
      width: photo.width,
      height: photo.height,
      orientation: photo.orientation,
      section: photo.section.slug,
      caption: photo.caption,
    })),
  );
}
