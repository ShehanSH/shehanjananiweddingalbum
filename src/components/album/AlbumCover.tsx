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
    <div className="album-page flex h-full min-h-0 flex-col items-center justify-center px-5 pb-16 pt-6 text-center sm:px-8 sm:pb-16 sm:pt-8">
      <FloralCorner className="pointer-events-none absolute left-4 top-4 h-24 w-24 text-sage/50" />
      <FloralCorner className="pointer-events-none absolute bottom-4 right-4 h-24 w-24 rotate-180 text-sage/50" />

      <p className="shrink-0 text-[11px] tracking-[0.42em] uppercase text-sage-deep">The Wedding Album</p>

      <h1 className="mt-4 shrink-0 font-script text-5xl text-brown sm:mt-5 sm:text-7xl">{COUPLE.groom}</h1>
      <p className="my-1 shrink-0 font-serif text-xl text-blush sm:my-2 sm:text-2xl">&</p>
      <h1 className="shrink-0 font-script text-5xl text-brown sm:text-7xl">{COUPLE.bride}</h1>

      {photo ? (
        <div className="mt-4 min-h-0 w-32 max-h-[38%] flex-1 overflow-hidden sm:mt-5 sm:w-44">
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
        <FloralAccent className="mt-5 h-16 w-16 shrink-0 text-sage/70" />
      )}

      <p className="mt-4 shrink-0 text-xs tracking-[0.35em] uppercase text-brown-soft sm:mt-5">
        {COUPLE.weddingDate}
      </p>
    </div>
  );
}
