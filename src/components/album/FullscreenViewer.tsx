"use client";

import type { BookPhoto } from "@/lib/database/book";
import { clampNumber } from "@/lib/album/photoPlacement";
import { X, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function FullscreenViewer({
  photos,
  index,
  onClose,
  onChange,
}: {
  photos: BookPhoto[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const photo = photos[index];
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onChange(Math.max(0, index - 1));
      if (event.key === "ArrowRight") onChange(Math.min(photos.length - 1, index + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onChange, onClose]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-ivory" role="dialog" aria-modal aria-label="Photograph viewer">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-10 rounded-full p-2 hover:bg-white/10"
        aria-label="Close viewer"
      >
        <X size={20} />
      </button>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, index - 1))}
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 hover:bg-white/10 disabled:opacity-30"
        disabled={index === 0}
        aria-label="Previous photograph"
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        onClick={() => onChange(Math.min(photos.length - 1, index + 1))}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 hover:bg-white/10 disabled:opacity-30"
        disabled={index === photos.length - 1}
        aria-label="Next photograph"
      >
        <ChevronRight />
      </button>
      <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          className="rounded-full bg-white/10 p-2 hover:bg-white/20"
          aria-label="Zoom out"
          onClick={() => setZoom((value) => clampNumber(value - 0.25, 1, 4))}
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          className="rounded-full bg-white/10 p-2 hover:bg-white/20"
          aria-label="Zoom in"
          onClick={() => setZoom((value) => clampNumber(value + 0.25, 1, 4))}
        >
          <Plus size={16} />
        </button>
      </div>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden p-8"
        onClick={onClose}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((value) => clampNumber(value - event.deltaY * 0.0018, 1, 4));
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          setZoom((value) => (value === 1 ? 2 : 1));
          setOffset({ x: 0, y: 0 });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.alt}
          className="max-h-full max-w-full cursor-grab object-contain"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            event.stopPropagation();
            (event.currentTarget as HTMLImageElement).setPointerCapture(event.pointerId);
            dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
          }}
          onPointerMove={(event) => {
            if (!dragRef.current) return;
            setOffset({
              x: dragRef.current.ox + (event.clientX - dragRef.current.x),
              y: dragRef.current.oy + (event.clientY - dragRef.current.y),
            });
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
        />
      </div>
      <p className="absolute bottom-5 left-0 right-0 text-center text-xs tracking-[0.25em] uppercase text-white/70">
        {index + 1} / {photos.length}
      </p>
    </div>
  );
}
