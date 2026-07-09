import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PN_BASE = "https://api.printnode.com";

function pnAuthHeader(): string {
  const key = process.env.PRINTNODE_API_KEY;
  if (!key) throw new Error("PRINTNODE_API_KEY is not configured");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b64 = typeof btoa === "function" ? btoa(`${key}:`) : (globalThis as any).Buffer.from(`${key}:`).toString("base64");
  return `Basic ${b64}`;
}

async function pn<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PN_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: pnAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PrintNode ${res.status}: ${text}`);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

type PNComputer = { id: number; name: string; state: string };
type PNCapabilities = {
  color?: boolean;
  copies?: number;
  duplex?: boolean;
  papers?: Record<string, [number, number]>;
  supported_options?: unknown;
};
type PNPrinter = {
  id: number;
  computer: PNComputer;
  name: string;
  description?: string;
  capabilities?: PNCapabilities;
  default: boolean;
  state: string;
  createTimestamp?: string;
};

function mapState(s: string): "online" | "offline" | "busy" | "ready" {
  const v = (s ?? "").toLowerCase();
  if (v.includes("offline")) return "offline";
  if (v.includes("busy") || v.includes("printing")) return "busy";
  if (v === "online" || v === "ok" || v === "ready") return "online";
  return "online";
}

function inferConnection(desc?: string): "wifi" | "ethernet" | "usb" | "bluetooth" | "unknown" {
  const d = (desc ?? "").toLowerCase();
  if (d.includes("usb")) return "usb";
  if (d.includes("wifi") || d.includes("wireless") || d.includes("wi-fi")) return "wifi";
  if (d.includes("ethernet") || d.includes("tcp") || d.includes("ip")) return "ethernet";
  if (d.includes("bluetooth")) return "bluetooth";
  return "unknown";
}

async function getServerSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const discoverPrinters = createServerFn({ method: "POST" }).handler(async () => {
  const printers = await pn<PNPrinter[]>("/printers");
  const supabase = await getServerSupabase();

  // Upsert each printer
  for (const p of printers) {
    const papers = p.capabilities?.papers ? Object.keys(p.capabilities.papers) : [];
    await supabase
      .from("printers")
      .upsert(
        {
          provider: "printnode",
          provider_printer_id: String(p.id),
          computer_id: String(p.computer?.id ?? ""),
          computer_name: p.computer?.name ?? null,
          printer_name: p.name,
          display_name: p.name,
          connection_type: inferConnection(p.description),
          driver_name: p.description ?? null,
          status: mapState(p.state),
          capabilities: {
            color: !!p.capabilities?.color,
            duplex: !!p.capabilities?.duplex,
            papers,
          },
          last_connected_at: new Date().toISOString(),
        },
        { onConflict: "provider,provider_printer_id", ignoreDuplicates: false },
      );
  }

  return { discovered: printers.length };
});

export const listPrinters = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("printers").select("*").order("display_name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const setDefaultPrinter = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from("printers").update({ is_default: true }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renamePrinter = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), displayName: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from("printers").update({ display_name: data.displayName }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePrinter = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from("printers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const submitInput = z.object({
  printerId: z.string().uuid(),
  fileName: z.string().min(1),
  contentBase64: z.string().min(1),
  contentType: z.enum(["pdf_base64", "raw_base64"]).default("pdf_base64"),
  title: z.string().optional(),
  copies: z.number().int().min(1).max(999).default(1),
  color: z.boolean().default(false),
  duplex: z.boolean().default(false),
  paperSize: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const submitPrintJobFn = createServerFn({ method: "POST" })
  .inputValidator((d) => submitInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = await getServerSupabase();
    const { data: printer, error: pErr } = await supabase
      .from("printers")
      .select("id, provider_printer_id, display_name")
      .eq("id", data.printerId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!printer) throw new Error("Printer not found");

    const payload = {
      printerId: Number(printer.provider_printer_id),
      title: data.title ?? data.fileName,
      contentType: data.contentType,
      content: data.contentBase64,
      source: "SwiftPrint",
      options: {
        copies: data.copies,
        color: data.color,
        duplex: data.duplex ? "long-edge" : undefined,
        paper: data.paperSize,
      },
    };

    let providerJobId: string | null = null;
    let status = "queued";
    let errorMessage: string | null = null;
    try {
      const created = await pn<number>("/printjobs", { method: "POST", body: JSON.stringify(payload) });
      providerJobId = String(created);
      status = "sent";
    } catch (e) {
      status = "failed";
      errorMessage = e instanceof Error ? e.message : String(e);
    }

    const { data: row, error: iErr } = await supabase
      .from("print_jobs")
      .insert({
        provider: "printnode",
        provider_job_id: providerJobId,
        printer_id: data.printerId,
        file_name: data.fileName,
        status,
        settings: data.settings ?? {},
        error_message: errorMessage,
      })
      .select()
      .single();
    if (iErr) throw new Error(iErr.message);
    if (errorMessage) throw new Error(errorMessage);
    return { id: row.id, providerJobId, printerName: printer.display_name };
  });

export const fetchJobStatusFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = await getServerSupabase();
    const { data: job, error } = await supabase.from("print_jobs").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!job) throw new Error("Job not found");
    if (!job.provider_job_id) return { status: job.status };

    try {
      const states = await pn<Array<{ state: string; createTimestamp: string }>>(
        `/printjobs/${job.provider_job_id}/states`,
      );
      const latest = states.at(-1)?.state?.toLowerCase() ?? job.status;
      let mapped = latest;
      if (latest.includes("done") || latest.includes("printed")) mapped = "completed";
      else if (latest.includes("error") || latest.includes("failed")) mapped = "failed";
      else if (latest.includes("cancel")) mapped = "cancelled";
      else if (latest.includes("progress") || latest.includes("printing")) mapped = "printing";
      else if (latest.includes("queue")) mapped = "queued";
      await supabase.from("print_jobs").update({ status: mapped }).eq("id", data.id);
      return { status: mapped };
    } catch {
      return { status: job.status };
    }
  });