"use client";

import { COUPLE } from "@/lib/constants";
import { FloralAccent, FloralCorner } from "./FloralAccent";
import type { BookPhoto } from "@/lib/database/book";
import type { PhotoPlacement } from "@/lib/album/photoPlacement";
import { PhotoFrame } from "./PhotoFrame";

export function AlbumCover({
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
    <div className="album-page album-cover-page flex h-full min-h-0 flex-col items-center justify-center px-4 pb-16 pt-5 text-center sm:px-8 sm:pb-16 sm:pt-8">
      <FloralCorner className="pointer-events-none absolute left-4 top-4 hidden h-24 w-24 text-sage/50 sm:block" />
      <FloralCorner className="pointer-events-none absolute bottom-4 right-4 hidden h-24 w-24 rotate-180 text-sage/50 sm:block" />

      <p className="album-cover-kicker shrink-0 text-[10px] tracking-[0.42em] uppercase text-sage-deep sm:text-[11px]">
        The Wedding Album
      </p>

      <h1 className="mt-3 shrink-0 font-script text-4xl text-brown sm:mt-5 sm:text-7xl">{COUPLE.groom}</h1>
      <p className="album-cover-amp my-1 shrink-0 font-serif text-lg text-blush sm:my-2 sm:text-2xl">&</p>
      <h1 className="shrink-0 font-script text-4xl text-brown sm:text-7xl">{COUPLE.bride}</h1>

      {photo ? (
        <div className="album-cover-photo mt-3 min-h-0 w-[62%] max-h-[46%] flex-1 overflow-hidden sm:mt-5 sm:w-44 sm:max-h-[38%]">
          <PhotoFrame
            photo={photo}
            interactive={interactive}
            onOpen={onOpen}
            onTransform={onTransform}
            onDelete={onDelete}
            priority
          />
        </div>
      ) : (
        <FloralAccent className="album-cover-photo mt-5 h-16 w-16 shrink-0 text-sage/70" />
      )}

      <p className="album-cover-date mt-4 shrink-0 text-xs tracking-[0.35em] uppercase text-brown-soft sm:mt-5">
        {COUPLE.weddingDate}
      </p>
    </div>
  );
}
