"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";

type Section = { id: string; title: string; slug: string };

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  error?: string;
  preview: string;
  abort?: AbortController;
};

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

export function PhotoUploader({
  sections,
  onComplete,
}: {
  sections: Section[];
  onComplete: () => void;
}) {
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!sectionId && sections[0]) setSectionId(sections[0].id);
  }, [sectionId, sections]);

  const remaining = useMemo(() => items.filter((item) => item.progress < 100 && !item.error).length, [items]);

  async function uploadOne(item: UploadItem) {
    try {
      const dims = await readDimensions(item.file);
      const body = new FormData();
      body.append("file", item.file);
      body.append("sectionId", sectionId);
      body.append("width", String(dims.width));
      body.append("height", String(dims.height));
      const controller = new AbortController();
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, abort: controller, progress: 15 } : entry)),
      );
      const response = await fetch("/api/upload", { method: "POST", body, signal: controller.signal });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, progress: 100 } : entry)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, error: message } : entry)),
      );
    }
  }

  async function queueFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      progress: 0,
      preview: URL.createObjectURL(file),
    }));
    setItems((current) => [...next, ...current]);
    for (const item of next) {
      await uploadOne(item);
    }
    onComplete();
  }

  return (
    <div className="rounded-3xl border border-brown/10 bg-paper p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Upload photographs</h2>
          <p className="text-sm text-brown-soft">Drag in many files. The studio stays responsive during large batches.</p>
        </div>
        <label className="text-sm">
          Section
          <select
            className="ml-2 rounded-full border border-brown/15 bg-ivory px-3 py-2"
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          if (event.dataTransfer.files) void queueFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center ${drag ? "border-sage bg-cream" : "border-brown/20"}`}
      >
        <span className="font-serif text-xl">Drop wedding photographs here</span>
        <span className="mt-2 text-sm text-soft-gray">or click to choose files</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void queueFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {items.length ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.slice(0, 12).map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-ivory p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="" className="h-14 w-10 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.file.name}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream">
                  <div className="h-full bg-sage" style={{ width: `${item.progress}%` }} />
                </div>
                {item.error ? <p className="mt-1 text-xs text-blush">{item.error}</p> : null}
              </div>
              {item.progress < 100 && !item.error ? (
                <button
                  type="button"
                  className="text-xs uppercase tracking-widest text-soft-gray"
                  onClick={() => item.abort?.abort()}
                >
                  Cancel
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex items-center justify-between text-sm text-brown-soft">
        <span>{remaining ? `${remaining} uploading…` : items.length ? "Uploads complete" : ""}</span>
        {items.some((item) => item.error) ? (
          <Button
            variant="ghost"
            onClick={() => {
              const failed = items.filter((item) => item.error);
              failed.forEach((item) => void uploadOne({ ...item, error: undefined, progress: 0 }));
            }}
          >
            Retry failed
          </Button>
        ) : null}
      </div>
    </div>
  );
}
