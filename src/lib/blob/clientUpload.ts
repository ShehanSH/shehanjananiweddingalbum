import { upload } from "@vercel/blob/client";

const FULL_EDGE = 2400;
const DISPLAY_EDGE = 1280;
const FULL_QUALITY = 0.82;
const DISPLAY_QUALITY = 0.72;

async function rasterizePhoto(file: File, maxEdge: number, quality: number) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read this photograph. Please use a JPG or PNG.");
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
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
      quality,
    );
  });

  return {
    file: new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }),
    width,
    height,
  };
}

export async function preparePhotoFile(file: File) {
  return rasterizePhoto(file, FULL_EDGE, FULL_QUALITY);
}

async function registerPhoto(
  file: File,
  prepared: { file: File; width: number; height: number },
  blobUrl: string,
  thumbnailUrl: string,
  sectionId?: string,
) {
  const response = await fetch("/api/admin/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blobUrl,
      thumbnailUrl,
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

async function uploadBlobFile(file: File, prefix: string) {
  const safeName = file.name.replace(/[^\w.\-]+/g, "-");
  return upload(`album/${prefix}-${Date.now()}-${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/blob",
    multipart: file.size > 4_000_000,
  });
}

export async function uploadAlbumPhoto(file: File, sectionId?: string) {
  const [prepared, display] = await Promise.all([
    rasterizePhoto(file, FULL_EDGE, FULL_QUALITY),
    rasterizePhoto(file, DISPLAY_EDGE, DISPLAY_QUALITY),
  ]);

  try {
    const [fullBlob, displayBlob] = await Promise.all([
      uploadBlobFile(prepared.file, "full"),
      uploadBlobFile(display.file, "display"),
    ]);
    return registerPhoto(file, prepared, fullBlob.url, displayBlob.url, sectionId);
  } catch {
    const body = new FormData();
    body.append("file", display.file);
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
