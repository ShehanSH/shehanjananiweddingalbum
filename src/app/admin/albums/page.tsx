"use client";

import { AlbumEditor } from "@/components/admin/AlbumEditor";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading } from "@/components/ui/Loading";
import type { BookPage } from "@/lib/database/book";
import { useCallback, useEffect, useState } from "react";

type DraftAlbum = {
  id: string;
  version: number;
  coverPhotoId?: string | null;
  closingPhotoId?: string | null;
};

export default function AdminAlbumsPage() {
  const [draft, setDraft] = useState<DraftAlbum | null>(null);
  const [bookPages, setBookPages] = useState<BookPage[]>([]);
  const [photos, setPhotos] = useState<{ id: string; thumbnailUrl?: string | null; blobUrl: string; filename: string }[]>([]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [albumRes, photoRes] = await Promise.all([fetch("/api/admin/album"), fetch("/api/admin/photos")]);
      if (!albumRes.ok || !photoRes.ok) throw new Error("load failed");
      const albumData = await albumRes.json();
      const photoData = await photoRes.json();
      setDraft(albumData.draft);
      setBookPages(Array.isArray(albumData.book) ? albumData.book : []);
      setPhotos(photoData);
      setLoaded(true);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (error) return <ErrorState title="Album editor unavailable" />;
  if (!loaded) return <Loading label="Loading album" />;

  return (
    <div>
      <h1 className="font-serif text-4xl">Album</h1>
      <p className="mt-2 mb-8 text-brown-soft">
        Every album page is listed here. Choose a layout, click a numbered frame to upload, then save.
      </p>
      <AlbumEditor
        draft={draft}
        bookPages={bookPages}
        photos={photos}
        onChange={(book) => {
          if (Array.isArray(book)) setBookPages(book);
          void refresh();
        }}
      />
    </div>
  );
}
