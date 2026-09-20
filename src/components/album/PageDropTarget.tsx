"use client";

import type { BookPage } from "@/lib/database/book";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function PageDropTarget({
  page,
  enabled,
  children,
  onDropFiles,
}: {
  page: BookPage;
  enabled?: boolean;
  children: React.ReactNode;
  onDropFiles?: (page: BookPage, files: FileList, slotIndex?: number) => void;
}) {
  const [over, setOver] = useState(false);

  if (!enabled) return children;

  return (
    <div
      className={cn("page-drop-target", over && "is-over")}
      data-album-interact="true"
      onDragEnter={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOver(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        if (event.dataTransfer.files.length) {
          onDropFiles?.(page, event.dataTransfer.files);
        }
      }}
    >
      {children}
    </div>
  );
}
