"use client";

import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { PhotoManager, type AdminPhoto } from "@/components/admin/PhotoManager";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading } from "@/components/ui/Loading";
import { useCallback, useEffect, useState } from "react";

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [sections, setSections] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [photoRes, settingRes] = await Promise.all([fetch("/api/admin/photos"), fetch("/api/admin/settings")]);
      if (!photoRes.ok || !settingRes.ok) throw new Error("load failed");
      const [photoData, settingData] = await Promise.all([photoRes.json(), settingRes.json()]);
      setPhotos(photoData);
      setSections(settingData.sections);
      setLoaded(true);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (error) return <ErrorState title="Photographs unavailable" />;
  if (!loaded) return <Loading label="Loading photographs" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Photographs</h1>
        <p className="mt-2 text-brown-soft">Upload, order, caption and assign each image to a section.</p>
      </div>
      <PhotoUploader sections={sections} onComplete={() => void refresh()} />
      {photos.length ? (
        <PhotoManager photos={photos} sections={sections} onChange={() => void refresh()} />
      ) : (
        <EmptyState title="No photographs yet" body="Upload photographs into the Couple Shoot and Wedding Function parts of the album." />
      )}
    </div>
  );
}
