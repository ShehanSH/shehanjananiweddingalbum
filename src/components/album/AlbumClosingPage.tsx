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
    <div className="album-page album-closing-page flex h-full min-h-0 flex-col items-center justify-center px-5 text-center sm:px-8">
      <FloralAccent className="mb-3 h-8 w-8 shrink-0 text-sage/60 sm:mb-6 sm:h-12 sm:w-12" />
      <p className="max-w-sm shrink-0 font-serif text-2xl leading-relaxed text-brown sm:text-3xl">{INTRO_COPY.closing}</p>
      {photo ? (
        <div className="album-closing-photo mt-5 w-[min(78%,20rem)] min-h-[16rem] h-[min(48%,26rem)] max-h-[48%] overflow-hidden sm:mt-8">
          <PhotoFrame
            photo={photo}
            interactive={interactive}
            onOpen={onOpen}
            onTransform={onTransform}
            onDelete={onDelete}
          />
        </div>
      ) : null}
      <p className="mt-5 shrink-0 text-xs tracking-[0.28em] uppercase text-soft-gray sm:mt-8">{INTRO_COPY.withLove}</p>
      <p className="mt-3 shrink-0 font-script text-4xl text-brown">
        {COUPLE.groom} & {COUPLE.bride}
      </p>
      <p className="mt-4 shrink-0 text-[11px] tracking-[0.28em] uppercase text-brown-soft sm:mt-5">{COUPLE.weddingDate}</p>
      <p className="mt-2 shrink-0 text-[11px] tracking-[0.2em] uppercase text-soft-gray">
        {COUPLE.venue}, {COUPLE.venueCity}
      </p>
    </div>
  );
}
