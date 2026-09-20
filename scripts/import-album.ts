import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const EXPORT_PATH = path.join(process.cwd(), "prisma", "data", "album-export.json");

type Snapshot = {
  sections: Array<Record<string, unknown>>;
  photos: Array<Record<string, unknown>>;
  albums: Array<Record<string, unknown>>;
  pages: Array<Record<string, unknown>>;
  settings: Array<Record<string, unknown>>;
};

function stamp(value: Record<string, unknown>) {
  const next = { ...value };
  for (const key of ["createdAt", "updatedAt"]) {
    if (typeof next[key] === "string") next[key] = new Date(String(next[key]));
  }
  return next;
}

async function main() {
  const snapshot = JSON.parse(await readFile(EXPORT_PATH, "utf8")) as Snapshot;

  await prisma.albumPage.deleteMany();
  await prisma.album.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.section.deleteMany();
  await prisma.setting.deleteMany();

  for (const section of snapshot.sections) {
    await prisma.section.create({ data: stamp(section) as never });
  }
  for (const photo of snapshot.photos) {
    await prisma.photo.create({ data: stamp(photo) as never });
  }
  for (const album of snapshot.albums) {
    await prisma.album.create({ data: stamp(album) as never });
  }
  for (const page of snapshot.pages) {
    await prisma.albumPage.create({ data: stamp(page) as never });
  }
  for (const setting of snapshot.settings) {
    await prisma.setting.create({ data: setting as never });
  }

  console.log(
    `Imported ${snapshot.photos.length} photos, ${snapshot.pages.length} pages, ${snapshot.albums.length} albums.`,
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
