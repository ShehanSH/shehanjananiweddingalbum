import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");
const EXPORT_PATH = path.join(process.cwd(), "prisma", "data", "album-export.json");
const PROGRESS_PATH = path.join(process.cwd(), ".data", "blob-upload-progress.json");
const MAX_EDGE = 2400;
const JPEG_QUALITY = 85;

function filenameFromUrl(url: string) {
  if (url.startsWith("/api/media/")) return url.replace("/api/media/", "");
  try {
    return decodeURIComponent(url.split("/").pop() || "");
  } catch {
    return "";
  }
}

async function loadProgress(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(PROGRESS_PATH, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

async function saveProgress(progress: Record<string, string>) {
  await mkdir(path.dirname(PROGRESS_PATH), { recursive: true });
  await writeFile(PROGRESS_PATH, JSON.stringify(progress, null, 2), "utf8");
}

async function webImageBytes(filepath: string, mimeType: string) {
  const original = await readFile(filepath);
  const image = sharp(original, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  const needsResize = Math.max(width, height) > MAX_EDGE;
  const isJpeg = mimeType.includes("jpeg") || mimeType.includes("jpg") || /\.jpe?g$/i.test(filepath);

  if (!needsResize && isJpeg && original.byteLength < 1_800_000) {
    return { bytes: original, contentType: mimeType || "image/jpeg" };
  }

  const pipeline = needsResize ? image.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside" }) : image;
  const bytes = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  return { bytes, contentType: "image/jpeg" };
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required. Create a Vercel Blob store and add the token.");
  }

  const photos = await prisma.photo.findMany({ orderBy: { createdAt: "asc" } });
  const progress = await loadProgress();

  for (const [index, photo] of photos.entries()) {
    if (photo.blobUrl.includes("blob.vercel-storage.com") || progress[photo.id]) {
      const url = progress[photo.id] || photo.blobUrl;
      progress[photo.id] = url;
      if (!photo.blobUrl.includes("blob.vercel-storage.com")) {
        await prisma.photo.update({
          where: { id: photo.id },
          data: { blobUrl: url, thumbnailUrl: url },
        });
      }
      console.log(`[${index + 1}/${photos.length}] already on Blob: ${photo.filename}`);
      continue;
    }

    const filename = filenameFromUrl(photo.blobUrl) || photo.filename;
    const filepath = path.join(UPLOAD_DIR, filename);
    const { bytes, contentType } = await webImageBytes(filepath, photo.mimeType || "image/jpeg");
    let blob;
    let attempt = 0;
    while (true) {
      try {
        blob = await put(`album/${filename}`, bytes, {
          access: "public",
          token,
          contentType,
          addRandomSuffix: false,
          allowOverwrite: true,
        });
        break;
      } catch (error) {
        attempt += 1;
        if (attempt >= 4) throw error;
        const waitMs = attempt * 4000;
        console.warn(`[${index + 1}/${photos.length}] retry ${attempt} for ${photo.filename}: ${(error as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    if (!blob) throw new Error(`Upload failed for ${photo.filename}`);
    progress[photo.id] = blob.url;
    await saveProgress(progress);
    await prisma.photo.update({
      where: { id: photo.id },
      data: { blobUrl: blob.url, thumbnailUrl: blob.url },
    });
    console.log(
      `[${index + 1}/${photos.length}] uploaded ${photo.filename} (${(bytes.byteLength / 1024 / 1024).toFixed(2)} MB)`,
    );
  }

  const snapshot = JSON.parse(await readFile(EXPORT_PATH, "utf8")) as {
    photos: Array<{ id: string; blobUrl: string; thumbnailUrl: string | null }>;
  };
  snapshot.photos = snapshot.photos.map((photo) => {
    const url = progress[photo.id];
    return url ? { ...photo, blobUrl: url, thumbnailUrl: url } : photo;
  });
  await writeFile(EXPORT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Updated ${Object.keys(progress).length} photograph URLs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
