import { PrismaClient } from "@prisma/client";
import { parseImageIds, serializeImageIds } from "../src/lib/utils";
import { deletePhotoFile } from "../src/lib/blob/storage";

const prisma = new PrismaClient();

function isSamplePhoto(photo: { blobUrl: string; filename: string }) {
  return (
    photo.blobUrl.includes("unsplash.com") ||
    photo.blobUrl.includes("images.unsplash") ||
    /^(shoot|day)-\d+\.jpe?g$/i.test(photo.filename)
  );
}

async function main() {
  const photos = await prisma.photo.findMany();
  const samples = photos.filter(isSamplePhoto);
  const keep = photos.filter((photo) => !isSamplePhoto(photo));

  for (const photo of samples) {
    const pages = await prisma.albumPage.findMany();
    for (const page of pages) {
      const ids = parseImageIds(page.imageIds);
      if (!ids.includes(photo.id)) continue;
      const next = ids.map((id) => (id === photo.id ? "" : id));
      if (next.every((id) => !id)) {
        await prisma.albumPage.delete({ where: { id: page.id } });
      } else {
        await prisma.albumPage.update({
          where: { id: page.id },
          data: { imageIds: serializeImageIds(next), isManuallyEdited: true },
        });
      }
    }

    await prisma.album.updateMany({
      where: { coverPhotoId: photo.id },
      data: { coverPhotoId: null },
    });
    await prisma.album.updateMany({
      where: { closingPhotoId: photo.id },
      data: { closingPhotoId: null },
    });

    await prisma.photo.delete({ where: { id: photo.id } });
    await deletePhotoFile(photo.blobUrl);
  }

  console.log(`Removed ${samples.length} sample photographs. Kept ${keep.length} of yours.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
