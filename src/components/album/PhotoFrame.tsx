"use client";

import type { BookPhoto } from "@/lib/database/book";
import {
  clampPlacement,
  MAX_PHOTO_SCALE,
  MIN_PHOTO_SCALE,
  normalizePlacement,
  type PhotoPlacement,
} from "@/lib/album/photoPlacement";
import { cn } from "@/lib/utils";
import { Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ZOOM_STEP = 0.2;

function isPhotoControl(target: EventTarget | null) {
  return Boolean(
    target instanceof Element && target.closest("button, input, .photo-zoom-controls, .photo-delete"),
  );
}

export function PhotoFrame({
  photo,
  className,
  priority = false,
  interactive = false,
  onTransform,
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
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const latest = useRef(placement);
  latest.current = placement;

  useEffect(() => {
    setPlacement(normalizePlacement(photo));
  }, [photo.id, photo.offsetX, photo.offsetY, photo.scale]);

  useEffect(() => {
    if (!interactive) return;
    const node = frameRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      commit({ ...latest.current, scale: latest.current.scale - event.deltaY * 0.0016 });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [interactive]);

  function commit(next: PhotoPlacement, persist = true) {
    const clamped = clampPlacement(next);
    setPlacement(clamped);
    latest.current = clamped;
    if (persist) onTransform?.(photo.id, clamped);
  }

  function nudgeZoom(delta: number) {
    commit({ ...latest.current, scale: latest.current.scale + delta });
  }

  function pointerDistance(event: React.TouchEvent) {
    const [a, b] = Array.from(event.touches);
    if (!a || !b) return 0;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function stopControlGesture(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <div
      ref={frameRef}
      tabIndex={interactive ? 0 : undefined}
      data-album-interact={interactive ? "true" : undefined}
      className={cn(
        "photo-frame group",
        interactive && "is-interactive",
        dragging && "is-dragging",
        active && "is-active",
        className,
      )}
      onPointerDown={(event) => {
        if (!interactive) return;
        if (isPhotoControl(event.target)) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.stopPropagation();
        setActive(true);
        frameRef.current?.setPointerCapture(event.pointerId);
        dragRef.current = {
          x: event.clientX,
          y: event.clientY,
          ox: latest.current.offsetX,
          oy: latest.current.offsetY,
          moved: false,
        };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (!interactive || !dragRef.current) return;
        event.preventDefault();
        const dx = event.clientX - dragRef.current.x;
        const dy = event.clientY - dragRef.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
        const rect = frameRef.current?.getBoundingClientRect();
        if (!rect?.width || !rect.height) return;
        commit(
          {
            ...latest.current,
            offsetX: dragRef.current.ox + (dx / rect.width) * 100,
            offsetY: dragRef.current.oy + (dy / rect.height) * 100,
          },
          false,
        );
      }}
      onPointerUp={() => {
        if (!interactive) return;
        const moved = dragRef.current?.moved;
        dragRef.current = null;
        setDragging(false);
        if (moved) {
          onTransform?.(photo.id, latest.current);
        }
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        setDragging(false);
      }}
      onDoubleClick={(event) => {
        if (!interactive || isPhotoControl(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        const current = latest.current.scale;
        commit({
          ...latest.current,
          scale: current >= 2.2 ? 1 : current + 0.45,
        });
      }}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          event.stopPropagation();
          nudgeZoom(ZOOM_STEP);
        } else if (event.key === "-" || event.key === "_") {
          event.preventDefault();
          event.stopPropagation();
          nudgeZoom(-ZOOM_STEP);
        } else if (event.key === "0") {
          event.preventDefault();
          event.stopPropagation();
          commit({ ...latest.current, scale: 1 });
        } else if (
          event.target instanceof HTMLInputElement &&
          (event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown")
        ) {
          event.stopPropagation();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setActive(false);
        }
      }}
      onTouchStart={(event) => {
        if (!interactive || event.touches.length !== 2) return;
        event.stopPropagation();
        pinchRef.current = {
          distance: pointerDistance(event),
          scale: latest.current.scale,
        };
      }}
      onTouchMove={(event) => {
        if (!interactive || !pinchRef.current || event.touches.length !== 2) return;
        event.preventDefault();
        event.stopPropagation();
        const distance = pointerDistance(event);
        if (!pinchRef.current.distance) return;
        commit(
          {
            ...latest.current,
            scale: pinchRef.current.scale * (distance / pinchRef.current.distance),
          },
          false,
        );
      }}
      onTouchEnd={() => {
        if (!pinchRef.current) return;
        pinchRef.current = null;
        onTransform?.(photo.id, latest.current);
      }}
      role="group"
      aria-label={photo.alt}
    >
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
          className={cn(!interactive && "transition duration-700 ease-out group-hover:scale-[1.015]")}
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
          onPointerDown={stopControlGesture}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(photo.id);
          }}
        >
          <Trash2 size={12} />
        </button>
      ) : null}
      {interactive ? (
        <div
          className="photo-zoom-controls"
          data-album-interact="true"
          onPointerDown={stopControlGesture}
          onClick={stopControlGesture}
        >
          <button
            type="button"
            aria-label="Zoom out"
            onPointerDown={stopControlGesture}
            onClick={(event) => {
              event.stopPropagation();
              nudgeZoom(-ZOOM_STEP);
            }}
          >
            <Minus size={14} />
          </button>
          <input
            className="photo-zoom-slider"
            type="range"
            min={MIN_PHOTO_SCALE}
            max={MAX_PHOTO_SCALE}
            step={0.01}
            value={placement.scale}
            aria-label="Zoom"
            onPointerDown={stopControlGesture}
            onInput={(event) => {
              commit({ ...latest.current, scale: Number(event.currentTarget.value) }, false);
            }}
            onChange={(event) => {
              commit({ ...latest.current, scale: Number(event.currentTarget.value) });
            }}
          />
          <button
            type="button"
            aria-label="Zoom in"
            onPointerDown={stopControlGesture}
            onClick={(event) => {
              event.stopPropagation();
              nudgeZoom(ZOOM_STEP);
            }}
          >
            <Plus size={14} />
          </button>
          <span className="photo-zoom-value">{Math.round(placement.scale * 100)}%</span>
          <button
            type="button"
            aria-label="Reset zoom"
            onPointerDown={stopControlGesture}
            onClick={(event) => {
              event.stopPropagation();
              commit({ ...latest.current, offsetX: 0, offsetY: 0, scale: 1 });
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
