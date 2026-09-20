import { describe, expect, it } from "vitest";
import { generateAlbumPages, type EnginePhoto } from "./generateAlbumPages";
import { validateGeneratedPages } from "./pageValidation";

function photo(
  id: string,
  orientation: EnginePhoto["orientation"],
  isHero = false,
): EnginePhoto {
  const portrait = orientation === "PORTRAIT";
  const square = orientation === "SQUARE";
  const width = square ? 1200 : portrait ? 900 : 1600;
  const height = square ? 1200 : portrait ? 1350 : 1066;
  return {
    id,
    width,
    height,
    orientation,
    aspectRatio: width / height,
    isHero,
  };
}

function ids(count: number, orientation: EnginePhoto["orientation"], prefix: string) {
  return Array.from({ length: count }, (_, index) =>
    photo(`${prefix}-${index + 1}`, orientation),
  );
}

describe("generateAlbumPages", () => {
  it("returns an empty album for an empty collection", () => {
    expect(generateAlbumPages([])).toEqual([]);
  });

  it("places a single portrait on one page", () => {
    const images = [photo("one", "PORTRAIT")];
    const pages = generateAlbumPages(images);
    expect(pages).toHaveLength(1);
    expect(pages[0].images[0].id).toBe("one");
    expect(validateGeneratedPages(images, pages).valid).toBe(true);
  });

  it("places two images without losing either", () => {
    const images = [photo("a", "PORTRAIT"), photo("b", "PORTRAIT")];
    const pages = generateAlbumPages(images);
    const used = pages.flatMap((page) => page.images.map((image) => image.id));
    expect(used.sort()).toEqual(["a", "b"]);
  });

  it("places three mixed images exactly once", () => {
    const images = [
      photo("a", "PORTRAIT"),
      photo("b", "LANDSCAPE"),
      photo("c", "PORTRAIT"),
    ];
    const pages = generateAlbumPages(images, { section: "FUNCTION" });
    const used = pages.flatMap((page) => page.images.map((image) => image.id));
    expect(used.sort()).toEqual(["a", "b", "c"]);
    expect(new Set(used).size).toBe(3);
  });

  it("places four images exactly once", () => {
    const images = ids(4, "PORTRAIT", "p");
    const pages = generateAlbumPages(images);
    expect(validateGeneratedPages(images, pages).valid).toBe(true);
  });

  it("handles an odd number of portrait-heavy images", () => {
    const images = ids(11, "PORTRAIT", "odd");
    const pages = generateAlbumPages(images, { section: "WEDDING_SHOOT" });
    expect(validateGeneratedPages(images, pages).valid).toBe(true);
    expect(pages.length).toBeGreaterThan(1);
  });

  it("creates visual rhythm instead of repeating the same layout", () => {
    const images = ids(24, "PORTRAIT", "shoot");
    const pages = generateAlbumPages(images, { section: "WEDDING_SHOOT" });
    const layouts = pages.map((page) => page.layout);
    const unique = new Set(layouts);
    expect(unique.size).toBeGreaterThan(2);

    let longestRepeat = 1;
    let current = 1;
    for (let i = 1; i < layouts.length; i += 1) {
      if (layouts[i] === layouts[i - 1]) {
        current += 1;
        longestRepeat = Math.max(longestRepeat, current);
      } else {
        current = 1;
      }
    }
    expect(longestRepeat).toBeLessThanOrEqual(2);
  });

  it("prefers landscape layouts for a landscape-heavy collection", () => {
    const images = ids(20, "LANDSCAPE", "day");
    const pages = generateAlbumPages(images, { section: "FUNCTION" });
    const landscapeLayouts = pages.filter((page) =>
      page.layout.includes("LANDSCAPE") || page.layout === "FULL_BLEED_IMAGE",
    );
    expect(landscapeLayouts.length).toBeGreaterThan(0);
    expect(validateGeneratedPages(images, pages).valid).toBe(true);
  });

  it("preserves input order", () => {
    const images = [
      ...ids(5, "PORTRAIT", "p"),
      ...ids(3, "LANDSCAPE", "l"),
      ...ids(4, "PORTRAIT", "q"),
    ];
    const pages = generateAlbumPages(images, { section: "WEDDING_SHOOT" });
    const used = pages.flatMap((page) => page.images.map((image) => image.id));
    expect(used).toEqual(images.map((image) => image.id));
  });

  it("supports a large mixed collection", () => {
    const images = [
      ...ids(110, "PORTRAIT", "shoot-p"),
      ...ids(10, "LANDSCAPE", "shoot-l"),
      ...ids(20, "PORTRAIT", "day-p"),
      ...ids(120, "LANDSCAPE", "day-l"),
    ];
    const pages = generateAlbumPages(images, { section: "FUNCTION" });
    expect(validateGeneratedPages(images, pages).valid).toBe(true);
    expect(pages.length).toBeGreaterThan(40);
  });

  it("never duplicates photographs", () => {
    const images = ids(37, "PORTRAIT", "unique");
    const pages = generateAlbumPages(images);
    const used = pages.flatMap((page) => page.images.map((image) => image.id));
    expect(used.length).toBe(new Set(used).size);
  });

  it("gives a hero photograph its own page", () => {
    const images = [
      photo("hero", "PORTRAIT", true),
      photo("a", "PORTRAIT"),
      photo("b", "PORTRAIT"),
    ];
    const pages = generateAlbumPages(images, { section: "WEDDING_SHOOT" });
    expect(pages[0].images).toHaveLength(1);
    expect(pages[0].images[0].id).toBe("hero");
    expect(validateGeneratedPages(images, pages).valid).toBe(true);
  });

  it("does not cram four landscapes onto one page", () => {
    const images = ids(4, "LANDSCAPE", "wide");
    const pages = generateAlbumPages(images, { section: "FUNCTION" });
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((page) => page.images.length <= 3)).toBe(true);
  });

  it("prefers larger photographs over fewer pages", () => {
    const images = ids(24, "PORTRAIT", "roomy");
    const pages = generateAlbumPages(images, { section: "WEDDING_SHOOT" });
    const crowded = pages.filter((page) => page.images.length >= 4).length;
    expect(crowded).toBeLessThanOrEqual(Math.ceil(pages.length * 0.2));
    expect(pages.length).toBeGreaterThan(8);
  });
});
