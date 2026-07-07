import { API_CONFIG } from "@/config/api";

export interface UploadResponse {
  documentId: string;
  pageCount?: number;
  previewUrl?: string;
}

/**
 * Upload a document. Emits progress via callback.
 * In mock mode simulates progress with timers.
 * Replace with real XHR/fetch to `API_CONFIG.endpoints.uploadDocument` later.
 */
export function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<UploadResponse> {
  if (API_CONFIG.useMockApi) {
    return new Promise((resolve, reject) => {
      let pct = 0;
      const timer = setInterval(() => {
        pct += Math.random() * 18 + 6;
        if (pct >= 100) {
          pct = 100;
          onProgress?.(pct);
          clearInterval(timer);
          resolve({
            documentId: crypto.randomUUID(),
            pageCount: guessPageCount(file),
            previewUrl: file.type.startsWith("image/") || file.type === "application/pdf"
              ? URL.createObjectURL(file)
              : undefined,
          });
        } else {
          onProgress?.(pct);
        }
      }, 180);
      signal?.addEventListener("abort", () => {
        clearInterval(timer);
        reject(new DOMException("Upload aborted", "AbortError"));
      });
    });
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", API_CONFIG.endpoints.uploadDocument);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.((e.loaded / e.total) * 100);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error("Bad response")); }
      } else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(form);
  });
}

function guessPageCount(file: File): number | undefined {
  if (file.type === "application/pdf") {
    // Rough heuristic: ~50KB per page for PDFs.
    return Math.max(1, Math.round(file.size / (50 * 1024)));
  }
  if (file.type.startsWith("image/")) return 1;
  return undefined;
}