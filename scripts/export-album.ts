import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const [sections, photos, albums, pages, settings] = await Promise.all([
    prisma.section.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.photo.findMany({ orderBy: [{ createdAt: "asc" }] }),
    prisma.album.findMany({ orderBy: { version: "asc" } }),
    prisma.albumPage.findMany({ orderBy: [{ albumId: "asc" }, { pageNumber: "asc" }] }),
    prisma.setting.findMany(),
  ]);

  const snapshot = {
    exportedAt: new Date().toISOString(),
    sections,
    photos,
    albums,
    pages,
    settings,
  };

  const outDir = path.join(process.cwd(), "prisma", "data");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "album-export.json");
  await writeFile(outFile, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(
    `Exported ${photos.length} photos, ${pages.length} pages, ${albums.length} albums to prisma/data/album-export.json`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
