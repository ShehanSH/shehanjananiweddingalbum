"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PAGE_FLIP_SOUND_FALLBACK,
  PAGE_FLIP_SOUND_SRC,
  SOUND_STORAGE_KEY,
} from "@/lib/album/layoutConfig";

export function usePageFlipSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === "false") setEnabled(false);
    if (stored === "true") setEnabled(true);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = 0.28;
    audio.src = PAGE_FLIP_SOUND_SRC;
    const fallback = () => {
      if (!audio.src.includes(PAGE_FLIP_SOUND_FALLBACK)) {
        audio.src = PAGE_FLIP_SOUND_FALLBACK;
      }
    };
    audio.addEventListener("error", fallback);
    audioRef.current = audio;
    return () => {
      audio.removeEventListener("error", fallback);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const setSoundEnabled = useCallback((value: boolean) => {
    setEnabled(value);
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(value));
  }, []);

  const play = useCallback(() => {
    setReady(true);
    if (!enabled) return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 0.96 + Math.random() * 0.08;
      audio.volume = 0.24 + Math.random() * 0.08;
      void audio.play().catch(() => undefined);
    } catch {
      /* blocked or missing */
    }
  }, [enabled]);

  return { enabled, setSoundEnabled, play, interacted: ready };
}
