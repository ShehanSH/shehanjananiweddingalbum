import type { EnginePhoto, GeneratedPage } from "./generateAlbumPages";
import { LAYOUT_LIBRARY, type LayoutType } from "./layoutTypes";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGeneratedPages(
  images: EnginePhoto[],
  pages: GeneratedPage[],
): ValidationResult {
  const errors: string[] = [];
  const seen = new Set<string>();
  const inputIds = images.map((image) => image.id);

  if (new Set(inputIds).size !== inputIds.length) {
    errors.push("Input collection contains duplicate photograph ids.");
  }

  for (const page of pages) {
    const definition = LAYOUT_LIBRARY[page.layout as LayoutType];
    if (!definition) {
      errors.push(`Unknown layout ${page.layout} on page ${page.pageNumber}.`);
      continue;
    }
    if (page.images.length === 0) {
      errors.push(`Page ${page.pageNumber} has no photographs.`);
    }
    if (page.images.length > definition.slots) {
      errors.push(
        `Page ${page.pageNumber} uses ${page.images.length} images but ${page.layout} allows ${definition.slots}.`,
      );
    }
    for (const image of page.images) {
      if (seen.has(image.id)) {
        errors.push(`Photograph ${image.id} is duplicated.`);
      }
      seen.add(image.id);
    }
  }

  for (const image of images) {
    if (!seen.has(image.id)) {
      errors.push(`Photograph ${image.id} was not placed on any page.`);
    }
  }

  for (const id of seen) {
    if (!inputIds.includes(id)) {
      errors.push(`Page references unknown photograph ${id}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
