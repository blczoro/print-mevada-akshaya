import { useEffect } from "react";
import type { UploadedFile } from "@/types/print";

const STORAGE_KEY = "pending_print_file";
const SOURCE_VALUE = "local_share";

/**
 * Decode a base64 string (with or without a data-URL prefix) into a Uint8Array.
 */
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const bin = atob(clean.replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function guessMime(name: string, fallback?: string): string {
  if (fallback) return fallback;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    tif: "image/tiff",
    tiff: "image/tiff",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Reads a shared file dropped into sessionStorage by a native mobile wrapper.
 * Payload may be either:
 *   - a raw base64 string, or
 *   - a JSON blob { name, type?, data } where `data` is base64 (with or without data-URL prefix).
 * Returns null when nothing is pending or the payload is malformed.
 */
export function readPendingSharedFile(): UploadedFile | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  let name = "shared-document";
  let type: string | undefined;
  let b64 = raw;

  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { name?: string; type?: string; data?: string };
      if (parsed.data) b64 = parsed.data;
      if (parsed.name) name = parsed.name;
      if (parsed.type) type = parsed.type;
    } catch {
      // fall through: treat as raw base64
    }
  } else if (trimmed.startsWith("data:")) {
    const header = trimmed.slice(5, trimmed.indexOf(","));
    const mime = header.split(";")[0];
    if (mime) type = mime;
    b64 = trimmed;
  }

  try {
    const bytes = base64ToBytes(b64);
    const mime = guessMime(name, type);
    if (!name.includes(".")) {
      const ext = mime.split("/")[1]?.split("+")[0];
      if (ext) name = `${name}.${ext === "jpeg" ? "jpg" : ext}`;
    }
    const file = new File([bytes.buffer as ArrayBuffer], name, { type: mime });
    const canPreview = mime.startsWith("image/") || mime === "application/pdf" || mime.startsWith("text/");
    return {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      progress: 100,
      status: "ready",
      previewUrl: canPreview ? URL.createObjectURL(file) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Watches for `?source=local_share` on mount. When found, decodes the pending file
 * from sessionStorage, hands it to `onFile`, clears the storage key, and strips the
 * query parameter from the URL so it doesn't re-fire.
 */
export function useSharedFile(onFile: (file: UploadedFile) => void): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") !== SOURCE_VALUE) return;

    const uploaded = readPendingSharedFile();

    // Always clean up, even if decoding failed, so we don't loop.
    window.sessionStorage.removeItem(STORAGE_KEY);
    params.delete("source");
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);

    if (uploaded) onFile(uploaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
