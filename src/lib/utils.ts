import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getOrientation(
  width: number,
  height: number,
): "PORTRAIT" | "LANDSCAPE" | "SQUARE" {
  if (width === height) return "SQUARE";
  return height > width ? "PORTRAIT" : "LANDSCAPE";
}

export function parseImageIds(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function serializeImageIds(ids: string[]): string {
  return JSON.stringify(ids);
}

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
