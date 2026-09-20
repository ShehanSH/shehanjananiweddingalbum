import { NextResponse } from "next/server";
import { imageSize } from "image-size";
import { prisma } from "@/lib/database/client";
import { nextSortOrder } from "@/lib/database/photos";
import { uploadPhotoFile } from "@/lib/blob/storage";
import { getOrientation } from "@/lib/utils";
import { ensureDefaultSections } from "@/lib/database/sections";
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
    const sectionId = String(form.get("sectionId") || "");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A photograph file is required." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files can be uploaded." }, { status: 400 });
    }

    await ensureDefaultSections();
    const section =
      (sectionId
        ? await prisma.section.findUnique({ where: { id: sectionId } })
        : await prisma.section.findFirst({ orderBy: { sortOrder: "asc" } }));
    if (!section) {
      return NextResponse.json({ error: "No album section is available." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = dimensionsFromBuffer(buffer);
    const width = Number(form.get("width") || detected.width || 0);
    const height = Number(form.get("height") || detected.height || 0);
    if (!width || !height) {
      return NextResponse.json({ error: "Could not read photograph dimensions." }, { status: 400 });
    }

    const stored = await uploadPhotoFile(file);
    const sortOrder = await nextSortOrder(section.id);
    const photo = await prisma.photo.create({
      data: {
        blobUrl: stored.url,
        thumbnailUrl: stored.thumbnailUrl,
        filename: file.name,
        width,
        height,
        orientation: getOrientation(width, height),
        aspectRatio: width / height,
        fileSize: file.size,
        mimeType: file.type,
        sectionId: section.id,
        sortOrder,
      },
      include: { section: true },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed. Please retry." }, { status: 500 });
  }
}
