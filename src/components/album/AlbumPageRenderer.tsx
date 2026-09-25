"use client";

import type { BookPage, BookPhoto } from "@/lib/database/book";
import type { PhotoPlacement } from "@/lib/album/photoPlacement";
import { AlbumCover } from "./AlbumCover";
import { AlbumIntroduction } from "./AlbumIntroduction";
import { AlbumSection } from "./AlbumSection";
import { AlbumClosingPage } from "./AlbumClosingPage";
import { EditorialLayout } from "./EditorialLayout";
import { PageDropTarget } from "./PageDropTarget";

export function AlbumPageRenderer({
  page,
  onOpen,
  priority = false,
  editable = false,
  onDropFiles,
  onPhotoTransform,
  onDeletePhoto,
}: {
  page: BookPage;
  onOpen?: (photo: BookPhoto) => void;
  priority?: boolean;
  editable?: boolean;
  onDropFiles?: (page: BookPage, files: FileList, slotIndex?: number) => void;
  onPhotoTransform?: (photoId: string, next: PhotoPlacement) => void;
  onDeletePhoto?: (photoId: string) => void;
}) {
  const interactive = true;
  let content = (
    <div className="album-page">
      {page.layoutType ? (
        <EditorialLayout
          layout={page.layoutType}
          images={page.images}
          page={page}
          onOpen={onOpen}
          priority={priority}
          interactive={interactive}
          editable={editable}
          onTransform={editable ? onPhotoTransform : undefined}
          onDelete={editable ? onDeletePhoto : undefined}
          onDropFiles={onDropFiles}
        />
      ) : null}
      {page.caption ? (
        <p className="absolute bottom-4 left-0 right-0 px-6 text-center font-serif text-sm italic text-brown-soft">
          {page.caption}
        </p>
      ) : null}
      {page.showPageNumber ? (
        <span className="absolute bottom-3 right-4 text-[10px] tracking-[0.2em] text-soft-gray">
          {String(page.pageNumber).padStart(2, "0")}
        </span>
      ) : null}
    </div>
  );

  if (page.type === "COVER") {
    content = (
      <AlbumCover
        photo={page.images[0] ?? undefined}
        interactive={interactive}
        onOpen={onOpen}
        onTransform={editable ? onPhotoTransform : undefined}
        onDelete={editable ? onDeletePhoto : undefined}
      />
    );
  } else if (page.type === "INTRODUCTION") {
    content = <AlbumIntroduction />;
  } else if (page.type === "SECTION_INTRO") {
    content = (
      <AlbumSection
        title={page.sectionTitle || "Our Story"}
        subtitle={page.sectionSubtitle}
        description={page.sectionDescription}
      />
    );
  } else if (page.type === "CLOSING") {
    content = (
      <AlbumClosingPage
        photo={page.images[0] ?? undefined}
        interactive={interactive}
        onOpen={onOpen}
        onTransform={editable ? onPhotoTransform : undefined}
        onDelete={editable ? onDeletePhoto : undefined}
      />
    );
  }

  return (
    <PageDropTarget page={page} enabled={editable} onDropFiles={onDropFiles}>
      {content}
    </PageDropTarget>
  );
}
