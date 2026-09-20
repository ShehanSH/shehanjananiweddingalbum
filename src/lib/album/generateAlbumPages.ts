import { selectLayout } from "./layoutRules";
import { LAYOUT_LIBRARY, type EnginePhoto, type LayoutType } from "./layoutTypes";
import { validateGeneratedPages } from "./pageValidation";

export type { EnginePhoto } from "./layoutTypes";

export interface GenerateAlbumOptions {
  section: string;
  startPageNumber?: number;
}

export interface GeneratedPage {
  pageNumber: number;
  section: string;
  layout: LayoutType;
  images: EnginePhoto[];
}

export function generateAlbumPages(
  images: EnginePhoto[],
  options: GenerateAlbumOptions = { section: "WEDDING_SHOOT" },
): GeneratedPage[] {
  if (!images.length) return [];

  const pages: GeneratedPage[] = [];
  let index = 0;
  const recent: LayoutType[] = [];
  let pageNumber = options.startPageNumber ?? 1;
  let rhythmIndex = 0;
  let previousSlots = 0;

  while (index < images.length) {
    const remaining = images.slice(index);
    const layout = selectLayout(
      remaining,
      recent,
      options.section,
      rhythmIndex,
      previousSlots,
    );
    const slots = Math.min(layout.slots, remaining.length);
    const used = remaining.slice(0, slots);

    pages.push({
      pageNumber,
      section: options.section,
      layout: layout.type,
      images: used,
    });

    recent.push(layout.type);
    if (recent.length > 3) recent.shift();
    previousSlots = used.length;
    index += used.length;
    pageNumber += 1;
    rhythmIndex += 1;
  }

  const validation = validateGeneratedPages(images, pages);
  if (!validation.valid) {
    throw new Error(`Album generation failed: ${validation.errors.join(" ")}`);
  }

  return pages;
}

export function layoutLabel(type: LayoutType): string {
  return LAYOUT_LIBRARY[type]?.label ?? type;
}
