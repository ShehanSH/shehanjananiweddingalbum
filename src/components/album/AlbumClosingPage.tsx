"use client";

import { COUPLE, INTRO_COPY } from "@/lib/constants";
import { FloralAccent } from "./FloralAccent";
import type { BookPhoto } from "@/lib/database/book";
import type { PhotoPlacement } from "@/lib/album/photoPlacement";
import { PhotoFrame } from "./PhotoFrame";

export function AlbumClosingPage({
  photo,
  interactive = false,
  onOpen,
  onTransform,
  onDelete,
}: {
  photo?: BookPhoto;
  interactive?: boolean;
  onOpen?: (next: BookPhoto) => void;
  onTransform?: (photoId: string, next: PhotoPlacement) => void;
  onDelete?: (photoId: string) => void;
}) {
  return (
    <div className="album-page flex h-full flex-col items-center justify-center px-5 text-center sm:px-8">
      <FloralAccent className="mb-6 h-12 w-12 text-sage/60" />
      <p className="max-w-sm font-serif text-3xl leading-relaxed text-brown">{INTRO_COPY.closing}</p>
      {photo ? (
        <div className="mt-8 h-44 w-32 overflow-hidden">
          <PhotoFrame
            photo={photo}
            interactive={interactive}
            onOpen={onOpen}
            onTransform={onTransform}
            onDelete={onDelete}
          />
        </div>
      ) : null}
      <p className="mt-8 text-xs tracking-[0.28em] uppercase text-soft-gray">{INTRO_COPY.withLove}</p>
      <p className="mt-3 font-script text-4xl text-brown">
        {COUPLE.groom} & {COUPLE.bride}
      </p>
      <p className="mt-5 text-[11px] tracking-[0.28em] uppercase text-brown-soft">{COUPLE.weddingDate}</p>
      <p className="mt-2 text-[11px] tracking-[0.2em] uppercase text-soft-gray">
        {COUPLE.venue}, {COUPLE.venueCity}
      </p>
    </div>
  );
}
