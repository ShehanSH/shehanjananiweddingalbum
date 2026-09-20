import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertSection(
  slug: string,
  title: string,
  subtitle: string,
  description: string,
  sortOrder: number,
) {
  return prisma.section.upsert({
    where: { slug },
    update: { title, subtitle, description, sortOrder },
    create: { slug, title, subtitle, description, sortOrder },
  });
}

async function main() {
  await upsertSection(
    "wedding-shoot",
    "Couple Shoot",
    "Shehan & Janani",
    "Portraits of the two of us, before the celebration began.",
    1,
  );
  await upsertSection(
    "wedding-day",
    "Wedding Function",
    "17 July 2026",
    "The wedding day, family, and the celebration we will remember forever.",
    2,
  );

  await prisma.setting.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      value: JSON.stringify({ published: true }),
    },
  });

  console.log("Seeded album sections only. Existing photographs were left unchanged.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
