import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { ensureDefaultSections } from "@/lib/database/sections";

export async function GET() {
  await ensureDefaultSections();
  const [sections, settings] = await Promise.all([
    prisma.section.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.setting.findMany(),
  ]);
  return NextResponse.json({ sections, settings });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body?.section) {
    const section = await prisma.section.create({
      data: {
        slug: String(body.section.slug)
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-"),
        title: body.section.title,
        subtitle: body.section.subtitle || null,
        description: body.section.description || null,
        sortOrder: Number(body.section.sortOrder || 99),
      },
    });
    return NextResponse.json(section);
  }
  if (body?.id && body?.value) {
    const setting = await prisma.setting.upsert({
      where: { id: body.id },
      update: { value: typeof body.value === "string" ? body.value : JSON.stringify(body.value) },
      create: {
        id: body.id,
        value: typeof body.value === "string" ? body.value : JSON.stringify(body.value),
      },
    });
    return NextResponse.json(setting);
  }
  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
