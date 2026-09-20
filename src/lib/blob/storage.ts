import { put, del } from "@vercel/blob";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadPhotoFile(file: File) {
  const safeName = file.name.replace(/[^\w.\-]+/g, "-");
  const filename = `${Date.now()}-${randomUUID()}-${safeName}`;

  if (hasBlobToken()) {
    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return {
      url: blob.url,
      thumbnailUrl: blob.url,
      pathname: blob.pathname,
    };
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const filepath = path.join(LOCAL_UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);
  const url = `/api/media/${filename}`;
  return { url, thumbnailUrl: url, pathname: filename };
}

export async function deletePhotoFile(url: string) {
  if (!url) return;

  if (url.includes("blob.vercel-storage.com") && hasBlobToken()) {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return;
  }

  if (url.startsWith("/api/media/")) {
    const filename = url.replace("/api/media/", "");
    try {
      await unlink(path.join(LOCAL_UPLOAD_DIR, filename));
    } catch {
      /* already gone */
    }
  }
}

export function localUploadDir() {
  return LOCAL_UPLOAD_DIR;
}
