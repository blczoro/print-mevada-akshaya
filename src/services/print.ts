import { API_CONFIG } from "@/config/api";
import type { PrintJob, PrintSettings, JobStatus } from "@/types/print";

export interface SubmitJobArgs {
  documentId: string;
  fileName: string;
  printerId: string;
  printerName: string;
  settings: PrintSettings;
}

export async function submitPrintJob(args: SubmitJobArgs): Promise<PrintJob> {
  if (API_CONFIG.useMockApi) {
    await delay(1200);
    return {
      id: `JOB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      fileName: args.fileName,
      printerId: args.printerId,
      printerName: args.printerName,
      settings: args.settings,
      status: "queued",
      createdAt: Date.now(),
    };
  }
  const res = await fetch(API_CONFIG.endpoints.submitJob, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error("Failed to submit print job");
  return res.json();
}

export async function fetchJobStatus(id: string): Promise<{ status: JobStatus }> {
  if (API_CONFIG.useMockApi) {
    await delay(300);
    return { status: "printing" };
  }
  const res = await fetch(API_CONFIG.endpoints.jobStatus(id));
  if (!res.ok) throw new Error("Failed to fetch job status");
  return res.json();
}

export async function cancelPrintJob(id: string): Promise<void> {
  if (API_CONFIG.useMockApi) {
    await delay(300);
    return;
  }
  const res = await fetch(API_CONFIG.endpoints.cancelJob(id), { method: "POST" });
  if (!res.ok) throw new Error("Failed to cancel job");
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }