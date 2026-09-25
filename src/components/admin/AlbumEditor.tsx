"use client";

import { LAYOUT_LIBRARY, LAYOUT_TYPES, type LayoutType } from "@/lib/album/layoutTypes";
import { layoutDensityWarning } from "@/lib/album/layoutQuality";
import { padImageSlots } from "@/lib/album/bookPageNumbers";
import { readImageDimensions } from "@/lib/album/photoPlacement";
import type { BookPage } from "@/lib/database/book";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useMemo, useRef, useState, Fragment } from "react";
import { cn } from "@/lib/utils";

type Draft = {
  id: string;
  version: number;
  coverPhotoId?: string | null;
  closingPhotoId?: string | null;
};

type LibraryPhoto = {
  id: string;
  thumbnailUrl?: string | null;
  blobUrl: string;
  filename: string;
};

type PageEdit = {
  layoutType: string;
  caption: string;
  showPageNumber: boolean;
  imageIds: string[];
};

function pageKind(type: BookPage["type"]) {
  if (type === "COVER") return "Cover";
  if (type === "INTRODUCTION") return "Introduction";
  if (type === "SECTION_INTRO") return "Section";
  if (type === "CLOSING") return "Closing";
  return "Photo page";
}

function idsFromPage(page: BookPage) {
  return page.images.map((image) => image?.id ?? "");
}

function photoPreviewSrc(photo: LibraryPhoto | { url: string; thumbnailUrl?: string | null; blobUrl?: string }) {
  if ("blobUrl" in photo && photo.blobUrl) return photo.thumbnailUrl || photo.blobUrl;
  if ("url" in photo && photo.url) return photo.thumbnailUrl || photo.url;
  return photo.thumbnailUrl || "";
}

export function AlbumEditor({
  draft,
  bookPages,
  photos,
  onChange,
}: {
  draft: Draft | null;
  bookPages: BookPage[];
  photos: LibraryPhoto[];
  onChange: (book?: BookPage[]) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BookPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [edits, setEdits] = useState<Record<string, PageEdit>>({});
  const [localPhotos, setLocalPhotos] = useState<LibraryPhoto[]>([]);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const uploadTarget = useRef<{ page: BookPage; slotIndex: number } | null>(null);
  const editsRef = useRef<Record<string, PageEdit>>({});
  editsRef.current = edits;

  const library = useMemo(() => {
    const merged = new Map<string, LibraryPhoto>();
    [...photos, ...localPhotos].forEach((photo) => merged.set(photo.id, photo));
    return merged;
  }, [photos, localPhotos]);

  const savedEdits = useMemo(() => {
    const next: Record<string, PageEdit> = {};
    for (const page of bookPages) {
      next[page.id] = {
        layoutType: page.layoutType ?? "HERO_PORTRAIT",
        caption: page.caption ?? "",
        showPageNumber: page.showPageNumber,
        imageIds: idsFromPage(page),
      };
    }
    return next;
  }, [bookPages]);

  function pageEdit(page: BookPage): PageEdit {
    return (
      edits[page.id] ??
      savedEdits[page.id] ?? {
        layoutType: page.layoutType ?? "HERO_PORTRAIT",
        caption: page.caption ?? "",
        showPageNumber: page.showPageNumber,
        imageIds: idsFromPage(page),
      }
    );
  }

  function setPageEdit(page: BookPage, patch: Partial<PageEdit>) {
    setEdits((current) => {
      const base =
        current[page.id] ??
        savedEdits[page.id] ?? {
          layoutType: page.layoutType ?? "HERO_PORTRAIT",
          caption: page.caption ?? "",
          showPageNumber: page.showPageNumber,
          imageIds: idsFromPage(page),
        };
      const next = { ...current, [page.id]: { ...base, ...patch } };
      editsRef.current = next;
      return next;
    });
  }

  function latestEdit(page: BookPage): PageEdit {
    return (
      editsRef.current[page.id] ??
      savedEdits[page.id] ?? {
        layoutType: page.layoutType ?? "HERO_PORTRAIT",
        caption: page.caption ?? "",
        showPageNumber: page.showPageNumber,
        imageIds: idsFromPage(page),
      }
    );
  }

  function isDirty(page: BookPage) {
    const edit = pageEdit(page);
    const saved = savedEdits[page.id];
    if (!saved) return true;
    return (
      edit.layoutType !== saved.layoutType ||
      edit.caption !== saved.caption ||
      edit.showPageNumber !== saved.showPageNumber ||
      edit.imageIds.join("|") !== saved.imageIds.join("|")
    );
  }

  async function generate(overwriteManual: boolean) {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/album", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate", overwriteManual }),
    });
    setBusy(false);
    setConfirm(false);
    if (!response.ok) {
      setMessage("Could not generate the album.");
      return;
    }
    setEdits({});
    editsRef.current = {};
    onChange();
  }

  async function publish() {
    setBusy(true);
    const response = await fetch("/api/admin/album", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", draftId: draft?.id }),
    });
    setBusy(false);
    setMessage(response.ok ? "Album published." : "Publish failed.");
    onChange();
  }

  async function savePage(page: BookPage) {
    if (!draft) return;
    const edit = latestEdit(page);
    setSavingId(page.id);
    setMessage("");

    try {
      if (page.type === "COVER" || page.type === "CLOSING") {
        const response = await fetch("/api/admin/album", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cover",
            coverPhotoId: page.type === "COVER" ? edit.imageIds[0] || null : undefined,
            closingPhotoId: page.type === "CLOSING" ? edit.imageIds[0] || null : undefined,
          }),
        });
        if (!response.ok) throw new Error("Could not save this page.");
      } else if (page.type === "PHOTO") {
        const response = await fetch(`/api/admin/pages/${page.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layoutType: edit.layoutType,
            caption: edit.caption,
            showPageNumber: edit.showPageNumber,
            imageIds: padImageSlots(edit.imageIds, LAYOUT_LIBRARY[edit.layoutType as LayoutType]?.slots ?? edit.imageIds.length),
            isManuallyEdited: true,
          }),
        });
        if (!response.ok) throw new Error("Could not save this page.");
      }

      setEdits((current) => {
        const next = { ...current };
        delete next[page.id];
        editsRef.current = next;
        return next;
      });
      setMessage(`Page ${String(page.pageNumber).padStart(2, "0")} saved. The live album has been updated.`);
      onChange();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this page.");
    } finally {
      setSavingId(null);
    }
  }

  async function addPage(sectionId?: string | null) {
    if (!draft) return;
    setBusy(true);
    const response = await fetch("/api/admin/pages/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        albumId: draft.id,
        sectionId,
        layoutType: "HERO_PORTRAIT",
      }),
    });
    setBusy(false);
    if (!response.ok) {
      setMessage("Could not add a page.");
      return;
    }
    const data = await response.json().catch(() => ({}));
    setMessage("A new page was added. Click a frame to upload a photograph.");
    if (Array.isArray(data.pages)) onChange(data.pages);
    else onChange();
  }

  async function movePage(page: BookPage, direction: "up" | "down") {
    if (page.type !== "PHOTO") return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/pages/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: page.id, direction }),
    });
    setBusy(false);
    if (!response.ok) {
      setMessage("Could not move this page.");
      return;
    }
    const data = await response.json().catch(() => ({}));
    setMessage(`Page ${String(page.pageNumber).padStart(2, "0")} moved ${direction}.`);
    if (Array.isArray(data.pages)) onChange(data.pages);
    else onChange();
  }

  async function deletePage(page: BookPage) {
    if (page.type !== "PHOTO") return;
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" });
    setBusy(false);
    setDeleteTarget(null);
    if (!response.ok) {
      setMessage("Could not delete this page.");
      return;
    }
    setEdits((current) => {
      const next = { ...current };
      delete next[page.id];
      editsRef.current = next;
      return next;
    });
    setMessage(`Page ${String(page.pageNumber).padStart(2, "0")} was deleted.`);
    onChange();
  }

  function chooseSlot(page: BookPage, slotIndex: number) {
    uploadTarget.current = { page, slotIndex };
    fileInput.current?.click();
  }

  async function uploadFilesToSlot(page: BookPage, slotIndex: number, fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;

    const edit = latestEdit(page);
    const slots =
      page.type === "PHOTO"
        ? LAYOUT_LIBRARY[edit.layoutType as LayoutType]?.slots ?? Math.max(edit.imageIds.length, slotIndex + 1)
        : 1;
    const next = padImageSlots(edit.imageIds, slots);
    const selected = files.slice(0, Math.max(1, slots - slotIndex));

    for (let offset = 0; offset < selected.length; offset += 1) {
      const file = selected[offset];
      const targetIndex = slotIndex + offset;
      const key = `${page.id}-${targetIndex}`;
      setUploadingKey(key);
      setMessage(
        `Uploading to page ${String(page.pageNumber).padStart(2, "0")}, area ${targetIndex + 1}…`,
      );
      try {
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
        setLocalPhotos((current) => [...current, photo]);
        next[targetIndex] = photo.id;
        setPageEdit(page, { imageIds: [...next] });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not upload this photograph.");
        setUploadingKey(null);
        return;
      }
    }

    setUploadingKey(null);
    const saved = await persistPageImages(page, next);
    setMessage(
      saved
        ? `Photograph added to page ${String(page.pageNumber).padStart(2, "0")}.`
        : "Photograph is on this page. Click Save page to keep it after a refresh.",
    );
    if (saved) onChange();
  }

  async function persistPageImages(page: BookPage, imageIds: string[]) {
    if (!draft) return false;
    const edit = latestEdit(page);
    try {
      if (page.type === "COVER" || page.type === "CLOSING") {
        const response = await fetch("/api/admin/album", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cover",
            coverPhotoId: page.type === "COVER" ? imageIds[0] || null : undefined,
            closingPhotoId: page.type === "CLOSING" ? imageIds[0] || null : undefined,
          }),
        });
        return response.ok;
      }
      if (page.type !== "PHOTO") return false;
      const slots = LAYOUT_LIBRARY[edit.layoutType as LayoutType]?.slots ?? imageIds.length;
      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutType: edit.layoutType,
          caption: edit.caption,
          showPageNumber: edit.showPageNumber,
          imageIds: padImageSlots(imageIds, slots),
          isManuallyEdited: true,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function handleChosenFile(fileList: FileList | null) {
    const target = uploadTarget.current;
    uploadTarget.current = null;
    if (fileInput.current) fileInput.current.value = "";
    if (!target || !fileList?.length) return;
    await uploadFilesToSlot(target.page, target.slotIndex, fileList);
  }

  function clearSlot(page: BookPage, slotIndex: number) {
    const edit = pageEdit(page);
    const next = [...edit.imageIds];
    next[slotIndex] = "";
    setPageEdit(page, { imageIds: next });
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleChosenFile(event.target.files)}
      />
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => void generate(false)}>
          Generate album
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => setConfirm(true)}>
          Regenerate album
        </Button>
        <Button variant="ivory" disabled={busy || !draft} onClick={() => void publish()}>
          Publish album
        </Button>
        <a href="/album?preview=1" className="inline-flex items-center rounded-full border border-brown/20 px-5 py-2.5 text-sm uppercase tracking-[0.08em]">
          Open album
        </a>
      </div>
      {message ? <p className="text-sm text-sage-deep">{message}</p> : null}
      <p className="text-sm text-brown-soft">
        Draft version {draft?.version ?? "—"} · {bookPages.length} album pages in two parts: Couple Shoot and Wedding Function. Click or drag photographs onto a numbered frame, then save. Guests see the last published album until you click Publish.
      </p>

      <ul className="space-y-4">
        {bookPages.map((page, index) => {
          const edit = pageEdit(page);
          const canEditImages = page.type === "PHOTO" || page.type === "COVER" || page.type === "CLOSING";
          const canSave = canEditImages;
          const slots =
            page.type === "PHOTO"
              ? LAYOUT_LIBRARY[edit.layoutType as LayoutType]?.slots ?? 1
              : canEditImages
                ? 1
                : 0;
          const dirty = isDirty(page);
          const saving = savingId === page.id;
          const previous = bookPages[index - 1];
          const next = bookPages[index + 1];
          const partStart = Boolean(page.sectionSlug && page.sectionSlug !== previous?.sectionSlug);
          const partEnd = Boolean(page.sectionSlug && page.sectionSlug !== next?.sectionSlug);
          const sectionPhotos = bookPages.filter(
            (item) => item.type === "PHOTO" && item.sectionId === page.sectionId,
          );
          const sectionIndex = sectionPhotos.findIndex((item) => item.id === page.id);
          const canMoveUp = page.type === "PHOTO" && sectionIndex > 0;
          const canMoveDown =
            page.type === "PHOTO" && sectionIndex >= 0 && sectionIndex < sectionPhotos.length - 1;
          return (
            <Fragment key={page.id}>
              {partStart ? (
                <li className="list-none pt-2">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-sage">{page.sectionTitle}</p>
                </li>
              ) : null}
            <li className="rounded-3xl bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-soft-gray">
                    Album page {String(page.pageNumber).padStart(2, "0")} · {pageKind(page.type)}
                    {page.sectionTitle ? ` · ${page.sectionTitle}` : ""}
                    {dirty ? " · Unsaved" : ""}
                  </p>
                  {page.type === "INTRODUCTION" ? (
                    <p className="mt-3 max-w-sm text-sm text-brown-soft">{page.body}</p>
                  ) : null}
                  {page.type === "SECTION_INTRO" ? (
                    <p className="mt-3 text-sm text-brown-soft">{page.sectionDescription || page.sectionSubtitle}</p>
                  ) : null}
                  {canEditImages ? (
                    <>
                      <p className="mt-1 text-xs text-brown-soft">
                        {page.type === "PHOTO"
                          ? `${LAYOUT_LIBRARY[edit.layoutType as LayoutType]?.label ?? edit.layoutType} · ${slots} photo ${slots === 1 ? "area" : "areas"}`
                          : "Click or drop a photograph onto the frame"}
                      </p>
                      <div className={cn("album-layout layout-preview mt-3", page.type === "PHOTO" ? edit.layoutType : "HERO_PORTRAIT")}>
                        {Array.from({ length: slots }, (_, index) => {
                          const id = edit.imageIds[index];
                          const photo = id ? library.get(id) || page.images[index] : undefined;
                          const key = `${page.id}-${index}`;
                          const uploading = uploadingKey === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              className={cn("layout-slot layout-slot-button", !photo && "is-empty", dragKey === key && "is-over")}
                              onClick={() => chooseSlot(page, index)}
                              onDragEnter={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setDragKey(key);
                              }}
                              onDragOver={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                event.dataTransfer.dropEffect = "copy";
                                setDragKey(key);
                              }}
                              onDragLeave={(event) => {
                                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                                  setDragKey((current) => (current === key ? null : current));
                                }
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setDragKey(null);
                                void uploadFilesToSlot(page, index, event.dataTransfer.files);
                              }}
                              aria-label={`Upload photograph to page ${page.pageNumber}, area ${index + 1}`}
                            >
                              <span className="layout-slot-index">{index + 1}</span>
                              {uploading ? (
                                <div className="layout-slot-empty">
                                  <span>Uploading…</span>
                                </div>
                              ) : photo ? (
                                <div className="relative h-full w-full">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={photoPreviewSrc(photo)}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                  <span
                                    role="button"
                                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brown text-[10px] text-ivory"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      clearSlot(page, index);
                                    }}
                                    aria-label="Remove photograph from this area"
                                  >
                                    ×
                                  </span>
                                </div>
                              ) : (
                                <div className="layout-slot-empty">
                                  <span>Photo {index + 1}</span>
                                  <em>Click or drop to upload</em>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="flex min-w-[16rem] flex-col gap-2 text-sm">
                  {page.type === "PHOTO" ? (
                    <>
                      <label className="text-[11px] uppercase tracking-[0.18em] text-soft-gray">
                        Page {String(page.pageNumber).padStart(2, "0")} layout
                        <select
                          className="mt-1 w-full rounded-full border border-brown/15 bg-ivory px-3 py-2 text-sm normal-case tracking-normal text-brown"
                          value={edit.layoutType}
                          onChange={(event) => setPageEdit(page, { layoutType: event.target.value })}
                        >
                          {LAYOUT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {LAYOUT_LIBRARY[type].label} ({LAYOUT_LIBRARY[type].slots}{" "}
                              {LAYOUT_LIBRARY[type].slots === 1 ? "photo" : "photos"})
                            </option>
                          ))}
                        </select>
                      </label>
                      {layoutDensityWarning(edit.layoutType as LayoutType, edit.imageIds.filter(Boolean).length) ? (
                        <p className="max-w-xs text-xs text-brown-soft">
                          {layoutDensityWarning(edit.layoutType as LayoutType, edit.imageIds.filter(Boolean).length)}
                        </p>
                      ) : null}
                      <input
                        className="rounded-full border border-brown/15 bg-ivory px-3 py-2"
                        placeholder="Caption"
                        value={edit.caption}
                        onChange={(event) => setPageEdit(page, { caption: event.target.value })}
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={edit.showPageNumber}
                          onChange={(event) => setPageEdit(page, { showPageNumber: event.target.checked })}
                        />
                        Show page number
                      </label>
                    </>
                  ) : (
                    <p className="max-w-xs text-xs text-brown-soft">
                      {page.type === "COVER" || page.type === "CLOSING"
                        ? "Click the frame, choose a photograph, then save this page."
                        : "This page is part of the album story."}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {canSave ? (
                      <Button disabled={busy || saving || !dirty} onClick={() => void savePage(page)}>
                        {saving ? "Saving…" : "Save page"}
                      </Button>
                    ) : null}
                    {page.type === "PHOTO" ? (
                      <>
                        <Button
                          variant="ghost"
                          disabled={busy || saving || !canMoveUp}
                          onClick={() => void movePage(page, "up")}
                        >
                          Move up
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busy || saving || !canMoveDown}
                          onClick={() => void movePage(page, "down")}
                        >
                          Move down
                        </Button>
                        <Button
                          variant="danger"
                          disabled={busy || saving}
                          onClick={() => setDeleteTarget(page)}
                        >
                          Delete page
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
              {partEnd ? (
                <li className="list-none">
                  <Button
                    variant="ghost"
                    disabled={busy || !draft}
                    onClick={() => void addPage(page.sectionId)}
                  >
                    Add page to the end of {page.sectionTitle}
                  </Button>
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ul>

      <Modal open={confirm} title="Regenerate album" onClose={() => setConfirm(false)}>
        <p className="text-brown-soft">
          This will regenerate the album layout. Manually edited pages may be replaced.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
          <Button onClick={() => void generate(true)}>Regenerate</Button>
        </div>
      </Modal>
      <Modal
        open={Boolean(deleteTarget)}
        title="Delete page"
        onClose={() => setDeleteTarget(null)}
      >
        <p className="text-brown-soft">
          Remove album page {deleteTarget ? String(deleteTarget.pageNumber).padStart(2, "0") : ""} from
          the dashboard and the live album? Photographs on this page stay in the library until you
          delete them there.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={busy || !deleteTarget}
            onClick={() => deleteTarget && void deletePage(deleteTarget)}
          >
            Delete page
          </Button>
        </div>
      </Modal>
    </div>
  );
}
