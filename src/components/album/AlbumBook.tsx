"use client";

import type { BookPage } from "@/lib/database/book";
import type { PhotoPlacement } from "@/lib/album/photoPlacement";
import { AlbumNavigation } from "./AlbumNavigation";
import { AlbumTableOfContents } from "./AlbumTableOfContents";
import { BookStage } from "./BookStage";
import { useAlbumNavigation, useBookMode } from "./useAlbumNavigation";
import { usePageFlipSound } from "./usePageFlipSound";
import { SITE } from "@/lib/constants";
import { EmptyState } from "../ui/EmptyState";
import { SWIPE_THRESHOLD } from "@/lib/album/layoutConfig";
import { albumDisplayPage, persistAlbumPageInUrl } from "@/lib/album/pagePosition";
import { isAlbumInteractTarget, readImageDimensions } from "@/lib/album/photoPlacement";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Maximize2, Minimize2, Share2, Volume2, VolumeX } from "lucide-react";

export function AlbumBook({
  pages,
  startAt,
  albumId,
  editable = false,
}: {
  pages: BookPage[];
  startAt?: number;
  albumId?: string | null;
  editable?: boolean;
}) {
  const router = useRouter();
  const mode = useBookMode();
  const { enabled: soundEnabled, setSoundEnabled, play } = usePageFlipSound();
  const [bookPages, setBookPages] = useState(pages);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const transformTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    setBookPages(pages);
  }, [pages]);

  const navigation = useAlbumNavigation({
    pageCount: bookPages.length,
    startAt,
    mode,
    onFlip: play,
  });
  const {
    currentPage,
    opened,
    isFlipping,
    flipDirection,
    duration,
    goNext,
    goPrev,
    jumpTo,
  } = navigation;

  const [toc, setToc] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const nearby = bookPages
      .slice(Math.max(0, currentPage - 2), currentPage + 5)
      .flatMap((page) => page.images)
      .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo));
    nearby.forEach((photo) => {
      const image = new window.Image();
      image.src = photo.thumbnailUrl;
    });
  }, [currentPage, bookPages]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  useEffect(() => {
    if (!bookPages.length || isFlipping) return;
    persistAlbumPageInUrl(albumDisplayPage(currentPage, opened));
  }, [bookPages.length, currentPage, opened, isFlipping]);

  useEffect(() => {
    return () => {
      Object.values(transformTimers.current).forEach((id) => window.clearTimeout(id));
    };
  }, []);

  async function share() {
    const payload = { title: SITE.title, text: SITE.shareMessage, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function fullscreenElement() {
    const doc = document as Document & { webkitFullscreenElement?: Element | null };
    return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  }

  async function toggleFullscreen() {
    const node = stageRef.current;
    if (!node) return;
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const target = node as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (fullscreenElement()) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } else {
        await (target.requestFullscreen?.() ?? target.webkitRequestFullscreen?.());
      }
    } catch {
      /* browser blocked fullscreen */
    }
  }

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(fullscreenElement()));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  function applyPlacement(photoId: string, next: PhotoPlacement) {
    setBookPages((current) =>
      current.map((page) => ({
        ...page,
        images: page.images.map((image) =>
          image && image.id === photoId ? { ...image, ...next } : image,
        ),
      })),
    );
  }

  function handlePhotoTransform(photoId: string, next: PhotoPlacement) {
    applyPlacement(photoId, next);
    if (!editable) return;
    window.clearTimeout(transformTimers.current[photoId]);
    transformTimers.current[photoId] = window.setTimeout(() => {
      void fetch(`/api/admin/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    }, 420);
  }

  async function handleDropFiles(page: BookPage, files: FileList, slotIndex?: number) {
    if (!editable || !albumId || uploading) return;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;

    setUploading(true);
    setUploadMessage(images.length > 1 ? `Adding ${images.length} photographs…` : "Adding photograph…");

    try {
      const photoIds: string[] = [];
      for (const file of images) {
        const dims = await readImageDimensions(file);
        const body = new FormData();
        body.append("file", file);
        if (page.sectionId) body.append("sectionId", page.sectionId);
        body.append("width", String(dims.width));
        body.append("height", String(dims.height));
        const response = await fetch("/api/upload", { method: "POST", body });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }
        const photo = await response.json();
        photoIds.push(photo.id);
      }

      const response = await fetch("/api/admin/pages/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId,
          pageId: page.id,
          pageType: page.type,
          sectionId: page.sectionId,
          photoIds,
          slotIndex,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not place photographs on this page.");
      }
      const data = await response.json();
      if (Array.isArray(data.pages)) setBookPages(data.pages);
      setUploadMessage(images.length > 1 ? "Photographs added to the album." : "Photograph added to the album.");
      router.refresh();
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Could not add photographs.");
    } finally {
      setUploading(false);
      window.setTimeout(() => setUploadMessage(""), 2400);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!editable || !albumId || uploading) return;
    setUploading(true);
    setUploadMessage("Removing photograph…");
    try {
      const response = await fetch("/api/admin/pages/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId, photoId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete this photograph.");
      }
      const data = await response.json();
      if (Array.isArray(data.pages)) setBookPages(data.pages);
      setUploadMessage("Photograph deleted.");
      router.refresh();
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Could not delete this photograph.");
    } finally {
      setUploading(false);
      window.setTimeout(() => setUploadMessage(""), 2400);
    }
  }

  if (!bookPages.length) {
    return (
      <div className="paper-canvas min-h-screen">
        <EmptyState
          title="The album is being prepared"
          body="Shehan and Janani's wedding album will appear here once it is published."
        />
      </div>
    );
  }

  const displayCurrent = opened ? currentPage + 1 : 1;
  const displayTotal = bookPages.length;

  return (
    <div
      ref={stageRef}
      className="paper-canvas min-h-dvh overflow-x-hidden px-3 py-3 sm:px-6 sm:py-6"
    >
      <header className="mx-auto mb-3 flex w-full max-w-6xl min-w-0 items-center justify-between gap-2 text-brown sm:mb-4">
        <button
          type="button"
          onClick={() => setToc(true)}
          className="flex min-w-0 shrink-0 items-center gap-2 text-[10px] tracking-[0.18em] uppercase sm:text-[11px] sm:tracking-[0.25em]"
        >
          <BookOpen size={16} />
          <span className="hidden xs:inline sm:inline">Contents</span>
        </button>
        <p className="hidden font-script text-2xl sm:block">Shehan & Janani</p>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="text-brown-soft hover:text-brown"
            aria-label={fullscreen ? "Exit full screen" : "Open album in full screen"}
            aria-pressed={fullscreen}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-brown-soft hover:text-brown"
            aria-label="Toggle page flip sound"
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            onClick={share}
            className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase sm:text-[11px] sm:tracking-[0.25em]"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
      </header>

      {editable ? (
        <p className="mx-auto mb-3 max-w-6xl text-center text-[10px] tracking-[0.16em] uppercase text-brown-soft sm:text-[11px]">
          Drop photographs onto a marked area · Use +/−, the slider, scroll, pinch, or double-click to zoom · Drag to place · Tap the trash icon to delete
        </p>
      ) : null}
      {uploadMessage ? (
        <p className="mx-auto mb-3 max-w-6xl text-center text-xs text-sage-deep">{uploadMessage}</p>
      ) : null}

      <div
        className="mx-auto w-full max-w-6xl touch-pan-y"
        onTouchStart={(event) => {
          if (isAlbumInteractTarget(event.target)) {
            touchStart.current = null;
            return;
          }
          touchStart.current = {
            x: event.changedTouches[0]?.clientX ?? 0,
            y: event.changedTouches[0]?.clientY ?? 0,
          };
        }}
        onTouchEnd={(event) => {
          if (touchStart.current == null) return;
          if (isAlbumInteractTarget(event.target)) return;
          const point = event.changedTouches[0];
          const dx = point.clientX - touchStart.current.x;
          const dy = point.clientY - touchStart.current.y;
          touchStart.current = null;
          if (Math.abs(dx) < SWIPE_THRESHOLD) return;
          if (Math.abs(dy) > Math.abs(dx) * 0.75) return;
          if (dx < 0) goNext();
          else goPrev();
        }}
      >
        <BookStage
          pages={bookPages}
          currentPage={currentPage}
          opened={opened}
          mode={mode}
          isFlipping={isFlipping}
          flipDirection={flipDirection}
          duration={duration}
          editable={editable}
          onNext={goNext}
          onPrev={goPrev}
          onBegin={goNext}
          onDropFiles={handleDropFiles}
          onPhotoTransform={handlePhotoTransform}
          onDeletePhoto={handleDeletePhoto}
        />
      </div>

      <div className="mx-auto mt-5 max-w-6xl">
        <AlbumNavigation
          current={displayCurrent}
          total={displayTotal}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>

      {toc ? (
        <AlbumTableOfContents
          pages={bookPages}
          onJump={(index) => {
            jumpTo(index);
            setToc(false);
          }}
          onClose={() => setToc(false)}
        />
      ) : null}
    </div>
  );
}
