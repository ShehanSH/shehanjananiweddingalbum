"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function AlbumNavigation({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 text-brown sm:gap-5">
      <button
        type="button"
        onClick={onPrev}
        disabled={current <= 1}
        className="rounded-full border border-brown/15 p-3 sm:p-2 disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>
      <p className="min-w-16 text-center text-[11px] tracking-[0.28em] uppercase text-brown-soft sm:min-w-24">
        {current} / {total}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={current >= total}
        className="rounded-full border border-brown/15 p-3 sm:p-2 disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
