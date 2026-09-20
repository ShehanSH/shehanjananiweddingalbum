"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PAGE_FLIP_DURATION, SPREAD_BREAKPOINT } from "@/lib/album/layoutConfig";

export type FlipDirection = "next" | "prev";
export type BookMode = "single" | "spread";

export function useBookMode() {
  const [mode, setMode] = useState<BookMode>("single");

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${SPREAD_BREAKPOINT}px)`);
    const update = () => setMode(media.matches ? "spread" : "single");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return mode;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function alignToSpread(pageIndex: number, mode: BookMode) {
  if (pageIndex <= 0) return 0;
  if (mode === "single") return pageIndex;
  return pageIndex % 2 === 0 ? pageIndex - 1 : pageIndex;
}

export function useAlbumNavigation(options: {
  pageCount: number;
  startAt?: number;
  mode: BookMode;
  onFlip?: (direction: FlipDirection) => void;
}) {
  const { pageCount, startAt, mode, onFlip } = options;
  const reducedMotion = usePrefersReducedMotion();
  const initial = Math.min(Math.max(startAt ?? 0, 0), Math.max(pageCount - 1, 0));
  const [pageIndex, setPageIndex] = useState(initial);
  const [opened, setOpened] = useState(initial > 0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<FlipDirection>("next");

  const pageCountRef = useRef(pageCount);
  pageCountRef.current = pageCount;

  useEffect(() => {
    setPageIndex((current) => Math.min(current, Math.max(pageCount - 1, 0)));
  }, [pageCount]);

  useEffect(() => {
    if (typeof startAt !== "number") return;
    const next = Math.min(Math.max(startAt, 0), Math.max(pageCountRef.current - 1, 0));
    setPageIndex(next);
    setOpened(next > 0);
  }, [startAt]);

  const duration = reducedMotion ? 0 : PAGE_FLIP_DURATION;
  const currentPage = opened ? alignToSpread(pageIndex, mode) : 0;
  const maxIndex = Math.max(pageCount - 1, 0);
  const step = !opened || currentPage === 0 || mode === "single" ? 1 : 2;

  const finish = useCallback((nextIndex: number, open = true) => {
    window.setTimeout(() => {
      setPageIndex(nextIndex);
      setOpened(open);
      setIsFlipping(false);
    }, duration);
  }, [duration]);

  const goNext = useCallback(() => {
    if (isFlipping || pageCount === 0) return;
    if (!opened) {
      setFlipDirection("next");
      onFlip?.("next");
      if (duration === 0) {
        setOpened(true);
        setPageIndex(Math.min(1, maxIndex));
        return;
      }
      setIsFlipping(true);
      finish(Math.min(1, maxIndex), true);
      return;
    }
    const next = Math.min(maxIndex, currentPage + step);
    if (next === currentPage) return;
    setFlipDirection("next");
    onFlip?.("next");
    if (duration === 0) {
      setPageIndex(next);
      return;
    }
    setIsFlipping(true);
    finish(next, true);
  }, [isFlipping, pageCount, opened, duration, maxIndex, finish, currentPage, step, onFlip]);

  const goPrev = useCallback(() => {
    if (isFlipping || pageCount === 0) return;
    if (!opened || currentPage <= 1) {
      if (!opened && currentPage === 0) return;
      setFlipDirection("prev");
      onFlip?.("prev");
      if (duration === 0) {
        setOpened(false);
        setPageIndex(0);
        return;
      }
      setIsFlipping(true);
      finish(0, false);
      return;
    }
    const next = Math.max(1, currentPage - step);
    if (next === currentPage) return;
    setFlipDirection("prev");
    onFlip?.("prev");
    if (duration === 0) {
      setPageIndex(next);
      return;
    }
    setIsFlipping(true);
    finish(next, true);
  }, [isFlipping, pageCount, opened, currentPage, duration, step, finish, onFlip]);

  const jumpTo = useCallback((index: number) => {
    if (isFlipping) return;
    const next = Math.min(maxIndex, Math.max(0, index));
    setOpened(next > 0);
    setPageIndex(next);
  }, [isFlipping, maxIndex]);

  return {
    currentPage,
    opened,
    isFlipping,
    flipDirection,
    duration,
    goNext,
    goPrev,
    jumpTo,
    step,
  };
}
