import { NextResponse } from "next/server";
import { movePhotoPage } from "@/lib/database/pages";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pageId = String(body.pageId || "");
  const direction = body.direction === "down" ? "down" : body.direction === "up" ? "up" : "";

  if (!pageId || !direction) {
    return NextResponse.json({ error: "pageId and direction are required." }, { status: 400 });
  }

  const pages = await movePhotoPage(pageId, direction);
  if (!pages) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  return NextResponse.json({ pages });
}
