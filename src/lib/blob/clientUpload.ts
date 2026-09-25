import { upload } from "@vercel/blob/client";

const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.82;

export async function preparePhotoFile(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read this photograph. Please use a JPG or PNG.");
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not process this photograph.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Could not process this photograph."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  return {
    file: new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }),
    width,
    height,
  };
}

async function registerPhoto(
  file: File,
  prepared: { file: File; width: number; height: number },
  blobUrl: string,
  sectionId?: string,
) {
  const response = await fetch("/api/admin/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blobUrl,
      filename: file.name,
      width: prepared.width,
      height: prepared.height,
      sectionId,
      mimeType: prepared.file.type,
      fileSize: prepared.file.size,
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
  return response.json();
}

export async function uploadAlbumPhoto(file: File, sectionId?: string) {
  const prepared = await preparePhotoFile(file);
  const safeName = prepared.file.name.replace(/[^\w.\-]+/g, "-");

  try {
    const blob = await upload(`album/${Date.now()}-${safeName}`, prepared.file, {
      access: "public",
      handleUploadUrl: "/api/admin/blob",
      multipart: prepared.file.size > 4_000_000,
    });
    return registerPhoto(file, prepared, blob.url, sectionId);
  } catch {
    const body = new FormData();
    body.append("file", prepared.file);
    if (sectionId) body.append("sectionId", sectionId);
    body.append("width", String(prepared.width));
    body.append("height", String(prepared.height));
    const response = await fetch("/api/upload", { method: "POST", body });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Upload failed");
    }
    return response.json();
  }
}
