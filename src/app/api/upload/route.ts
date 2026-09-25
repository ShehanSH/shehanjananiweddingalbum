import { NextResponse } from "next/server";
import { imageSize } from "image-size";
import { uploadPhotoFile } from "@/lib/blob/storage";
import { createUploadedPhoto } from "@/lib/database/createUploadedPhoto";
import { isAdminAuthenticated } from "@/lib/auth/session";

export const runtime = "nodejs";

function dimensionsFromBuffer(buffer: Buffer) {
  try {
    const result = imageSize(buffer);
    return { width: result.width ?? 0, height: result.height ?? 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A photograph file is required." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files can be uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = dimensionsFromBuffer(buffer);
    const width = Number(form.get("width") || detected.width || 0);
    const height = Number(form.get("height") || detected.height || 0);
    const stored = await uploadPhotoFile(file);
    const photo = await createUploadedPhoto({
      blobUrl: stored.url,
      thumbnailUrl: stored.thumbnailUrl,
      filename: file.name,
      width,
      height,
      sectionId: String(form.get("sectionId") || ""),
      mimeType: file.type,
      fileSize: file.size,
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Upload failed. Please retry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
