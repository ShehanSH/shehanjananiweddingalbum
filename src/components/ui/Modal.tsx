"use client";

import { useEffect } from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-3xl bg-ivory p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl text-brown">{title}</h2>
          <button type="button" onClick={onClose} className="text-soft-gray hover:text-brown" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
