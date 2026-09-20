import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { localUploadDir } from "@/lib/blob/storage";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const filename = segments.join("/");
  if (filename.includes("..") || filename.includes("\\")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  try {
    const file = await readFile(path.join(localUploadDir(), filename));
    const ext = path.extname(filename).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg";
    return new NextResponse(Uint8Array.from(file), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
