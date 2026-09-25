"use client";

import type { BookPhoto } from "@/lib/database/book";
import { normalizePlacement, type PhotoPlacement } from "@/lib/album/photoPlacement";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function PhotoFrame({
  photo,
  className,
  priority = false,
  onDelete,
}: {
  photo: BookPhoto;
  onOpen?: (photo: BookPhoto) => void;
  className?: string;
  priority?: boolean;
  interactive?: boolean;
  onTransform?: (photoId: string, next: PhotoPlacement) => void;
  onDelete?: (photoId: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const [placement, setPlacement] = useState(() => normalizePlacement(photo));

  useEffect(() => {
    setPlacement(normalizePlacement(photo));
  }, [photo.id, photo.offsetX, photo.offsetY, photo.scale]);

  return (
    <div className={cn("photo-frame group", className)} role="img" aria-label={photo.alt}>
      {failed ? (
        <div className="flex h-full w-full items-center justify-center bg-cream text-sm text-soft-gray">
          Photograph unavailable
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.thumbnailUrl || photo.url}
          alt={photo.alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          draggable={false}
          style={{
            transform: `translate(${placement.offsetX}%, ${placement.offsetY}%) scale(${placement.scale})`,
          }}
        />
      )}
      {onDelete ? (
        <button
          type="button"
          className="photo-delete"
          data-album-interact="true"
          aria-label="Delete photograph"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(photo.id);
          }}
        >
          <Trash2 size={12} />
        </button>
      ) : null}
    </div>
  );
}
