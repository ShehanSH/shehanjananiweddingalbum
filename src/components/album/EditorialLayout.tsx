"use client";

import type { BookPage, BookPhoto } from "@/lib/database/book";
import type { LayoutType } from "@/lib/album/layoutTypes";
import { LAYOUT_LIBRARY } from "@/lib/album/layoutTypes";
import type { PhotoPlacement } from "@/lib/album/photoPlacement";
import { PhotoFrame } from "./PhotoFrame";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function EditorialLayout({
  layout,
  images,
  page,
  onOpen,
  priority = false,
  interactive = false,
  editable = false,
  onTransform,
  onDelete,
  onDropFiles,
}: {
  layout: LayoutType;
  images: Array<BookPhoto | null>;
  page?: BookPage;
  onOpen?: (photo: BookPhoto) => void;
  priority?: boolean;
  interactive?: boolean;
  editable?: boolean;
  onTransform?: (photoId: string, next: PhotoPlacement) => void;
  onDelete?: (photoId: string) => void;
  onDropFiles?: (page: BookPage, files: FileList, slotIndex?: number) => void;
}) {
  const slots = LAYOUT_LIBRARY[layout]?.slots ?? Math.max(images.length, 1);
  const cells = Array.from({ length: slots }, (_, index) => images[index] ?? null);
  const definition = LAYOUT_LIBRARY[layout];

  return (
    <div className={cn("album-layout-wrap", editable && "is-editing")}>
      {editable && definition ? (
        <p className="layout-guide-label">
          {definition.label} · {slots} photo {slots === 1 ? "area" : "areas"}
        </p>
      ) : null}
      <div className={cn("album-layout h-full w-full", layout)}>
      {cells.map((image, index) => (
        <LayoutSlot
          key={image?.id ?? `slot-${index}`}
          index={index}
          total={slots}
          photo={image}
          page={page}
          editable={editable}
          interactive={interactive}
          priority={priority && index === 0}
          onOpen={onOpen}
          onTransform={onTransform}
          onDelete={onDelete}
          onDropFiles={onDropFiles}
        />
      ))}
      </div>
    </div>
  );
}

function LayoutSlot({
  index,
  total,
  photo,
  page,
  editable,
  interactive,
  priority,
  onOpen,
  onTransform,
  onDelete,
  onDropFiles,
}: {
  index: number;
  total: number;
  photo: BookPhoto | null;
  page?: BookPage;
  editable?: boolean;
  interactive?: boolean;
  priority?: boolean;
  onOpen?: (photo: BookPhoto) => void;
  onTransform?: (photoId: string, next: PhotoPlacement) => void;
  onDelete?: (photoId: string) => void;
  onDropFiles?: (page: BookPage, files: FileList, slotIndex?: number) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={cn("layout-slot", !photo && "is-empty", over && "is-over")}
      data-album-interact={editable ? "true" : undefined}
      onDragEnter={(event) => {
        if (!editable) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      }}
      onDragOver={(event) => {
        if (!editable) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOver(false);
        }
      }}
      onDrop={(event) => {
        if (!editable || !page) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        if (event.dataTransfer.files.length) {
          onDropFiles?.(page, event.dataTransfer.files, index);
        }
      }}
    >
      {editable ? <span className="layout-slot-index">{index + 1}</span> : null}
      {photo ? (
        <PhotoFrame
          photo={photo}
          onOpen={onOpen}
          priority={priority}
          interactive={interactive}
          onTransform={onTransform}
          onDelete={onDelete}
        />
      ) : editable ? (
        <div className="layout-slot-empty">
          <span>Photo {index + 1}</span>
          <em>
            Drop here · {index + 1}/{total}
          </em>
        </div>
      ) : (
        <div className="layout-slot-empty is-quiet">
          <span>{index + 1}</span>
        </div>
      )}
    </div>
  );
}
