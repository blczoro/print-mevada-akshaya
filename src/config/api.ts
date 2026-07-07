// Central config for future backend integration. Swap URLs via env or here.

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export const API_CONFIG = {
  baseUrl: BASE,
  endpoints: {
    uploadDocument: `${BASE}/documents/upload`,
    listPrinters: `${BASE}/printers`,
    printerStatus: (id: string) => `${BASE}/printers/${id}/status`,
    discoverPrinters: `${BASE}/printers/discover`,
    testPrinter: `${BASE}/printers/test`,
    addPrinter: `${BASE}/printers`,
    deletePrinter: (id: string) => `${BASE}/printers/${id}`,
    submitJob: `${BASE}/jobs`,
    jobStatus: (id: string) => `${BASE}/jobs/${id}`,
    cancelJob: (id: string) => `${BASE}/jobs/${id}/cancel`,
  },
  // Toggle to false once a real backend exists.
  useMockApi: true,
} as const;

export const ACCEPTED_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".txt",
] as const;

export const ACCEPTED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff",
  "text/plain",
].join(",");

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB