import { prisma } from "./client";

export async function listSections() {
  return prisma.section.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getSectionBySlug(slug: string) {
  return prisma.section.findUnique({ where: { slug } });
}

export async function ensureDefaultSections() {
  const defaults = [
    {
      slug: "wedding-shoot",
      title: "Couple Shoot",
      subtitle: "Shehan & Janani",
      description: "Portraits of the two of us, before the celebration began.",
      sortOrder: 1,
    },
    {
      slug: "wedding-day",
      title: "Wedding Function",
      subtitle: "17 July 2026",
      description: "The wedding day, family, and the celebration we will remember forever.",
      sortOrder: 2,
    },
  ];

  for (const section of defaults) {
    await prisma.section.upsert({
      where: { slug: section.slug },
      update: {
        title: section.title,
        subtitle: section.subtitle,
        description: section.description,
        sortOrder: section.sortOrder,
      },
      create: section,
    });
  }

  return listSections();
}
