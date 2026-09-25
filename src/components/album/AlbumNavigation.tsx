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
    <div className="album-nav flex items-center justify-center gap-4 text-brown sm:gap-5">
      <button
        type="button"
        onClick={onPrev}
        disabled={current <= 1}
        className="album-nav-btn album-nav-prev rounded-full border border-brown/15 p-3 sm:p-2 disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft size={22} />
      </button>
      <p className="album-nav-count min-w-16 text-center text-[11px] tracking-[0.28em] uppercase text-brown-soft sm:min-w-24">
        {current} / {total}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={current >= total}
        className="album-nav-btn album-nav-next rounded-full border border-brown/15 p-3 sm:p-2 disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
