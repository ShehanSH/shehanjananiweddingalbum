"use client";

import type { BookPage, BookPhoto } from "@/lib/database/book";
import type { PhotoPlacement } from "@/lib/album/photoPlacement";
import { isAlbumInteractTarget } from "@/lib/album/photoPlacement";
import { AlbumPageRenderer } from "./AlbumPageRenderer";
import { PAGE_EDGE_RATIO, PAGE_FLIP_DURATION } from "@/lib/album/layoutConfig";
import { cn } from "@/lib/utils";
import type { BookMode, FlipDirection } from "./useAlbumNavigation";
import type { MouseEvent } from "react";

function PageView({
  page,
  onOpen,
  priority,
  editable,
  onDropFiles,
  onPhotoTransform,
  onDeletePhoto,
}: {
  page?: BookPage;
  onOpen?: (photo: BookPhoto) => void;
  priority?: boolean;
  editable?: boolean;
  onDropFiles?: (page: BookPage, files: FileList, slotIndex?: number) => void;
  onPhotoTransform?: (photoId: string, next: PhotoPlacement) => void;
  onDeletePhoto?: (photoId: string) => void;
}) {
  if (!page) {
    return <div className="album-page book-blank-page" />;
  }
  return (
    <AlbumPageRenderer
      page={page}
      onOpen={onOpen}
      priority={priority}
      editable={editable}
      onDropFiles={onDropFiles}
      onPhotoTransform={onPhotoTransform}
      onDeletePhoto={onDeletePhoto}
    />
  );
}

export function BookStage({
  pages,
  currentPage,
  opened,
  mode,
  isFlipping,
  flipDirection,
  duration = PAGE_FLIP_DURATION,
  editable = false,
  onOpenPhoto,
  onNext,
  onPrev,
  onBegin,
  onDropFiles,
  onPhotoTransform,
  onDeletePhoto,
}: {
  pages: BookPage[];
  currentPage: number;
  opened: boolean;
  mode: BookMode;
  isFlipping: boolean;
  flipDirection: FlipDirection;
  duration?: number;
  editable?: boolean;
  onOpenPhoto?: (photo: BookPhoto) => void;
  onNext: () => void;
  onPrev: () => void;
  onBegin: () => void;
  onDropFiles?: (page: BookPage, files: FileList, slotIndex?: number) => void;
  onPhotoTransform?: (photoId: string, next: PhotoPlacement) => void;
  onDeletePhoto?: (photoId: string) => void;
}) {
  const cover = pages[0];
  const single = mode === "single";
  const closing = isFlipping && flipDirection === "prev" && currentPage <= 1;
  const opening = isFlipping && flipDirection === "next" && (!opened || currentPage === 0);
  const showCover = !opened && !isFlipping;

  const currentLeft = pages[currentPage];
  const currentRight = !single ? pages[currentPage + 1] : undefined;
  const incomingIndex =
    flipDirection === "next"
      ? currentPage === 0
        ? 1
        : currentPage + (single ? 1 : 2)
      : Math.max(0, currentPage - (single ? 1 : 2));
  const incomingLeft = pages[incomingIndex];
  const incomingRight = !single ? pages[incomingIndex + 1] : undefined;

  const leftStatic = isFlipping && flipDirection === "prev" && !closing ? incomingLeft : currentLeft;
  const rightStatic = isFlipping && flipDirection === "next" && opened && !opening ? incomingRight : currentRight;

  const pageProps = {
    onOpen: onOpenPhoto,
    editable,
    onDropFiles,
    onPhotoTransform,
    onDeletePhoto,
  };

  if (showCover || opening || closing) {
    return (
      <div
        className="book-stage"
        style={{ ["--page-flip-duration" as string]: `${duration}ms` }}
      >
        <div className={cn("book-cover-wrap", (opening || closing) && "is-animating is-flipping")}>
          <div className="book-cover-shadow" />
          <div
            className={cn(
              "book-cover-board",
              opening && "book-cover-opening",
              closing && "book-cover-closing",
            )}
          >
            <PageView page={cover} priority {...pageProps} />
            <button
              type="button"
              className="book-open-button"
              onClick={onBegin}
              aria-label="Open album"
            >
              Begin Our Story
            </button>
          </div>
          {(opening || closing) && (
            <div className="book-cover-under">
              {single ? (
                <PageView page={pages[1]} {...pageProps} />
              ) : (
                <div className="book-spread">
                  <div className="book-page-left">
                    <PageView page={pages[1]} {...pageProps} />
                  </div>
                  <div className="book-spine" />
                  <div className="book-page-right">
                    <PageView page={pages[2]} {...pageProps} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function handleMarginFlip(event: MouseEvent<HTMLDivElement>) {
    if (isAlbumInteractTarget(event.target)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const x = (event.clientX - rect.left) / rect.width;
    if (x <= PAGE_EDGE_RATIO) onPrev();
    else if (x >= 1 - PAGE_EDGE_RATIO) onNext();
  }

  return (
    <div
      className="book-stage"
      style={{ ["--page-flip-duration" as string]: `${duration}ms` }}
    >
      <div
        className={cn("book-body", single ? "book-single" : "book-spread", isFlipping && "is-flipping")}
        onClick={handleMarginFlip}
      >
        <div className={cn("book-page-slot", !single && "book-page-left")}>
          <PageView page={single ? currentLeft : leftStatic} priority {...pageProps} />
        </div>
        {!single ? (
          <>
            <div className="book-spine" />
            <div className="book-page-slot book-page-right">
              <PageView page={rightStatic} {...pageProps} />
            </div>
          </>
        ) : null}

        {isFlipping ? (
          <div
            className={cn(
              "flip-sheet",
              single ? "flip-single" : flipDirection === "next" ? "flip-next" : "flip-prev",
            )}
            aria-hidden
          >
            <div className="flip-face flip-front">
              <PageView
                page={single ? currentLeft : flipDirection === "next" ? currentRight : currentLeft}
              />
              <div className="flip-curl" />
            </div>
            <div className="flip-face flip-back">
              <PageView
                page={single ? incomingLeft : flipDirection === "next" ? incomingLeft : incomingRight}
              />
              <div className="flip-curl" />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="book-edge book-edge-left"
          style={{ width: `${PAGE_EDGE_RATIO * 100}%` }}
          onClick={(event) => {
            event.stopPropagation();
            onPrev();
          }}
          aria-label="Previous page"
        />
        <button
          type="button"
          className="book-edge book-edge-right"
          style={{ width: `${PAGE_EDGE_RATIO * 100}%` }}
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
          aria-label="Next page"
        />
      </div>
    </div>
  );
}
