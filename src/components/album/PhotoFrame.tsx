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
const DEFAULT_PLACEMENT: PhotoPlacement = { offsetX: 0, offsetY: 0, scale: 1 };

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
  const onTransformRef = useRef(onTransform);
  onTransformRef.current = onTransform;
  const canEdit = interactive && Boolean(onTransform);

  useEffect(() => {
    setPlacement(normalizePlacement(photo));
  }, [photo.id, photo.offsetX, photo.offsetY, photo.scale]);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || !canEdit) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      commit({ ...latest.current, scale: latest.current.scale - event.deltaY * 0.0016 }, true);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [canEdit]);

  function commit(next: PhotoPlacement, persist = canEdit) {
    const clamped = clampPlacement(next);
    setPlacement(clamped);
    latest.current = clamped;
    if (persist) onTransformRef.current?.(photo.id, clamped);
  }

  function nudgeZoom(delta: number) {
    commit({ ...latest.current, scale: latest.current.scale + delta });
  }

  function resetPlacement() {
    commit(DEFAULT_PLACEMENT);
  }

  function stopControlGesture(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <div
      ref={frameRef}
      tabIndex={canEdit ? 0 : undefined}
      data-album-interact={canEdit ? "true" : undefined}
      className={cn(
        "photo-frame group",
        canEdit && "is-interactive",
        dragging && "is-dragging",
        active && "is-active",
        className,
      )}
      onPointerDown={(event) => {
        if (!canEdit || isPhotoControl(event.target)) return;
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
        if (!canEdit || !dragRef.current) return;
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
        if (!canEdit) return;
        const moved = dragRef.current?.moved;
        dragRef.current = null;
        setDragging(false);
        if (moved) commit(latest.current, true);
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        setDragging(false);
      }}
      onDoubleClick={(event) => {
        if (!canEdit || isPhotoControl(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        const current = latest.current.scale;
        commit({
          ...latest.current,
          scale: current >= 2.2 ? 1 : current + 0.45,
        });
      }}
      onKeyDown={(event) => {
        if (!canEdit) return;
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
          resetPlacement();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setActive(false);
        }
      }}
      onTouchStart={(event) => {
        if (!canEdit || event.touches.length !== 2) return;
        event.stopPropagation();
        pinchRef.current = {
          distance: pointerDistance(event),
          scale: latest.current.scale,
        };
      }}
      onTouchMove={(event) => {
        if (!canEdit || !pinchRef.current || event.touches.length !== 2) return;
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
        if (!canEdit || !pinchRef.current) return;
        pinchRef.current = null;
        commit(latest.current, true);
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
      {canEdit ? (
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
            aria-label="Reset zoom and position"
            onPointerDown={stopControlGesture}
            onClick={(event) => {
              event.stopPropagation();
              resetPlacement();
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function pointerDistance(event: React.TouchEvent) {
  const [a, b] = Array.from(event.touches);
  if (!a || !b) return 0;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
