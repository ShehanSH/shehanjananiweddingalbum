"use client";

import type { BookPage } from "@/lib/database/book";

export function AlbumTableOfContents({
  pages,
  onJump,
  onClose,
}: {
  pages: BookPage[];
  onJump: (index: number) => void;
  onClose: () => void;
}) {
  const shoot = pages.findIndex((page) => page.sectionSlug === "wedding-shoot" && page.type === "SECTION_INTRO");
  const day = pages.findIndex((page) => page.sectionSlug === "wedding-day" && page.type === "SECTION_INTRO");

  const items = [
    { label: "Cover", index: 0, number: "00" },
    { label: "Introduction", index: Math.max(pages.findIndex((page) => page.type === "INTRODUCTION"), 0), number: "01" },
    shoot >= 0 ? { label: "Couple Shoot", index: shoot, number: "01" } : null,
    day >= 0 ? { label: "Wedding Function", index: day, number: "02" } : null,
    {
      label: "Closing",
      index: Math.max(pages.findIndex((page) => page.type === "CLOSING"), pages.length - 1),
      number: "03",
    },
  ].filter(Boolean) as { label: string; index: number; number: string }[];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-brown/35 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-3xl bg-ivory px-8 py-10 text-center shadow-2xl">
        <p className="text-[11px] tracking-[0.4em] uppercase text-sage">Contents</p>
        <ul className="mt-8 space-y-6">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  onJump(item.index);
                  onClose();
                }}
                className="group"
              >
                <span className="block text-[11px] tracking-[0.3em] text-soft-gray">{item.number}</span>
                <span className="mt-1 block font-serif text-3xl text-brown group-hover:text-brown-soft">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onClose} className="mt-10 text-xs tracking-[0.3em] uppercase text-soft-gray">
          Close
        </button>
      </div>
    </div>
  );
}
