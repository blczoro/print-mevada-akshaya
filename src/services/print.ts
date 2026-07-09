import { submitPrintJobFn, fetchJobStatusFn } from "@/lib/printnode.functions";
import type { PrintJob, PrintSettings, JobStatus, UploadedFile } from "@/types/print";

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export interface SubmitJobArgs {
  file: UploadedFile;
  printerId: string;
  printerName: string;
  settings: PrintSettings;
}

export async function submitPrintJob(args: SubmitJobArgs): Promise<PrintJob> {
  const contentBase64 = await fileToBase64(args.file.file);
  const isPdfOrImage =
    args.file.file.type === "application/pdf" || args.file.file.type.startsWith("image/");
  if (!isPdfOrImage) {
    throw new Error(
      "Only PDF and image files can be sent directly to the printer. Please convert Office documents to PDF first.",
    );
  }
  const res = await submitPrintJobFn({
    data: {
      printerId: args.printerId,
      fileName: args.file.name,
      contentBase64,
      contentType: "pdf_base64",
      title: args.file.name,
      copies: args.settings.copies,
      color: args.settings.mode === "color",
      duplex: args.settings.duplex === "double",
      paperSize: args.settings.paperSize,
      settings: args.settings as unknown as Record<string, unknown>,
    },
  });
  return {
    id: res.id,
    fileName: args.file.name,
    printerId: args.printerId,
    printerName: res.printerName,
    settings: args.settings,
    status: "queued",
    createdAt: Date.now(),
  };
}

export async function fetchJobStatus(id: string): Promise<{ status: JobStatus }> {
  const res = await fetchJobStatusFn({ data: { id } });
  return { status: (res.status as JobStatus) ?? "queued" };
}

export async function cancelPrintJob(_id: string): Promise<void> {
  // PrintNode job cancellation is not exposed here; extend with DELETE /printjobs/<id> if needed.
  return;
}
