import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminPassword } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = String(body?.password ?? "");
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  await createAdminSession();
  return NextResponse.json({ ok: true });
}
