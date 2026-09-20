import { NextResponse } from "next/server";
import { loadAlbumBook } from "@/lib/database/loadAlbum";
import { isAdminAuthenticated } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get("preview") === "1" && (await isAdminAuthenticated());
    const data = await loadAlbumBook(preview);
    return NextResponse.json({
      status: data.album?.status ?? null,
      version: data.album?.version ?? null,
      pages: data.pages,
    });
  } catch {
    return NextResponse.json({ error: "Unable to load album." }, { status: 500 });
  }
}
