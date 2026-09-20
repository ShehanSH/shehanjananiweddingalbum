"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { formatDate } from "@/lib/utils";

export type AdminPhoto = {
  id: string;
  blobUrl: string;
  thumbnailUrl?: string | null;
  filename: string;
  orientation: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
  isHero?: boolean;
  section: { id: string; title: string; slug: string };
};

export function PhotoManager({
  photos,
  sections,
  onChange,
}: {
  photos: AdminPhoto[];
  sections: { id: string; title: string }[];
  onChange: () => void;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<AdminPhoto | null>(null);

  async function save() {
    if (!editing) return;
    await fetch(`/api/admin/photos/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: editing.caption,
        sectionId: editing.section.id,
        isHero: Boolean(editing.isHero),
      }),
    });
    setEditing(null);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Remove this photograph from the album library?")) return;
    await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
    onChange();
  }

  async function move(id: string, direction: -1 | 1) {
    const index = photos.findIndex((photo) => photo.id === id);
    const swap = photos[index + direction];
    if (!swap) return;
    const ordered = photos.map((photo) => photo.id);
    [ordered[index], ordered[index + direction]] = [ordered[index + direction], ordered[index]];
    await fetch("/api/admin/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ordered }),
    });
    onChange();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button variant={view === "grid" ? "primary" : "ghost"} onClick={() => setView("grid")}>
          Grid
        </Button>
        <Button variant={view === "list" ? "primary" : "ghost"} onClick={() => setView("list")}>
          List
        </Button>
      </div>
      {view === "grid" ? (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-2xl bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.thumbnailUrl || photo.blobUrl} alt={photo.filename} className="h-48 w-full object-contain bg-cream" />
              <div className="space-y-2 p-3 text-xs">
                <p className="truncate">{photo.filename}</p>
                <p className="text-soft-gray">
                  {photo.orientation} · {photo.section.title}
                  {photo.isHero ? " · Hero" : ""}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(photo)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => void remove(photo.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-paper">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brown/10 text-[11px] uppercase tracking-widest text-soft-gray">
                <th className="p-3">Photo</th>
                <th>Filename</th>
                <th>Orientation</th>
                <th>Section</th>
                <th>Order</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {photos.map((photo) => (
                <tr key={photo.id} className="border-b border-brown/5">
                  <td className="p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumbnailUrl || photo.blobUrl} alt="" className="h-14 w-10 object-cover" />
                  </td>
                  <td>{photo.filename}</td>
                  <td>{photo.orientation}</td>
                  <td>{photo.section.title}</td>
                  <td>
                    <button type="button" onClick={() => void move(photo.id, -1)} className="mr-2">
                      ↑
                    </button>
                    <button type="button" onClick={() => void move(photo.id, 1)}>
                      ↓
                    </button>
                  </td>
                  <td>{formatDate(photo.createdAt)}</td>
                  <td className="space-x-3 p-3">
                    <button type="button" onClick={() => setEditing(photo)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => void remove(photo.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-ivory p-6">
            <h3 className="font-serif text-2xl">Edit photograph</h3>
            <label className="mt-4 block text-sm">
              Caption
              <input
                className="mt-1 w-full rounded-2xl border border-brown/15 bg-paper px-3 py-2"
                value={editing.caption ?? ""}
                onChange={(event) => setEditing({ ...editing, caption: event.target.value })}
              />
            </label>
            <label className="mt-4 block text-sm">
              Section
              <select
                className="mt-1 w-full rounded-2xl border border-brown/15 bg-paper px-3 py-2"
                value={editing.section.id}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    section: { ...editing.section, id: event.target.value },
                  })
                }
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(editing.isHero)}
                onChange={(event) => setEditing({ ...editing, isHero: event.target.checked })}
              />
              Hero photograph
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={() => void save()}>Save</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
