export type PrintMode = "color" | "bw";
export type Duplex = "single" | "double";
export type PaperSize = "A4" | "A3" | "Letter" | "Legal" | "Photo";
export type Orientation = "portrait" | "landscape";
export type PageRangeMode = "all" | "custom";
export type Scaling = "fit" | "actual";

export interface PrintSettings {
  mode: PrintMode;
  duplex: Duplex;
  paperSize: PaperSize;
  orientation: Orientation;
  pageRangeMode: PageRangeMode;
  pageRange: string; // e.g. "1-5" or "3,5,7"
  copies: number;
  scaling: Scaling;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  previewUrl?: string;
  progress: number; // 0-100
  status: "queued" | "uploading" | "ready" | "error";
  error?: string;
}

export type PrinterStatus = "online" | "offline" | "busy" | "ready";

export type PrinterConnection = "wifi" | "ethernet" | "usb";
export type PrinterProtocol = "IPP" | "RAW" | "LPR";
export type PrinterSource = "auto" | "manual";

export interface Printer {
  id: string;
  name: string;
  location?: string;
  status: PrinterStatus;
  supportsColor: boolean;
  supportsDuplex: boolean;
  model?: string;
  manufacturer?: string;
  ipAddress?: string;
  hostname?: string;
  port?: number;
  protocol?: PrinterProtocol;
  connection?: PrinterConnection;
  paperSizes?: PaperSize[];
  source?: PrinterSource;
}

export interface ManualPrinterInput {
  name: string;
  address: string; // ip or hostname
  port: number;
  protocol: PrinterProtocol;
  connection: PrinterConnection;
}

export type PrinterTestResult =
  | { ok: true; printer: Printer }
  | { ok: false; reason: "not_found" | "timeout" | "auth_required" | "error"; message: string };

export type JobStatus =
  | "preparing"
  | "sending"
  | "queued"
  | "printing"
  | "completed"
  | "failed"
  | "cancelled";

export interface PrintJob {
  id: string;
  fileName: string;
  printerId: string;
  printerName: string;
  settings: PrintSettings;
  status: JobStatus;
  createdAt: number;
}

export const DEFAULT_SETTINGS: PrintSettings = {
  mode: "bw",
  duplex: "single",
  paperSize: "A4",
  orientation: "portrait",
  pageRangeMode: "all",
  pageRange: "",
  copies: 1,
  scaling: "fit",
};