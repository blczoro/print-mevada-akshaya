import type { PaperSize, Printer, PrinterConnection, PrinterStatus } from "@/types/print";
import {
  discoverPrinters as discoverFn,
  listPrinters as listFn,
  setDefaultPrinter as setDefaultFn,
  renamePrinter as renameFn,
  deletePrinter as deleteFn,
} from "@/lib/printnode.functions";

type DbPrinter = {
  id: string;
  provider_printer_id: string;
  computer_name: string | null;
  display_name: string;
  printer_name: string;
  connection_type: string | null;
  ip_address: string | null;
  port: number | null;
  vendor: string | null;
  model: string | null;
  status: string;
  is_default: boolean;
  capabilities: { color?: boolean; duplex?: boolean; papers?: string[] } | null;
};

const PAPER_MAP: Record<string, PaperSize> = {
  A4: "A4", A3: "A3", Letter: "Letter", Legal: "Legal", Photo: "Photo",
};

function toPrinter(r: DbPrinter): Printer {
  const caps = r.capabilities ?? {};
  const papers = (caps.papers ?? [])
    .map((p) => PAPER_MAP[p])
    .filter((p): p is PaperSize => !!p);
  const status: PrinterStatus =
    r.status === "offline" || r.status === "busy" || r.status === "ready" || r.status === "online"
      ? (r.status as PrinterStatus)
      : "online";
  return {
    id: r.id,
    providerPrinterId: Number(r.provider_printer_id),
    name: r.display_name,
    computerName: r.computer_name ?? undefined,
    location: r.computer_name ?? undefined,
    status,
    supportsColor: !!caps.color,
    supportsDuplex: !!caps.duplex,
    model: r.model ?? undefined,
    manufacturer: r.vendor ?? undefined,
    ipAddress: r.ip_address ?? undefined,
    port: r.port ?? undefined,
    connection: (r.connection_type ?? "unknown") as PrinterConnection,
    paperSizes: papers,
    isDefault: r.is_default,
  };
}

export async function fetchPrinters(): Promise<Printer[]> {
  const rows = (await listFn()) as unknown as DbPrinter[];
  return rows.map(toPrinter);
}

export async function discoverPrinters(): Promise<{ discovered: number }> {
  return await discoverFn();
}

export async function setDefaultPrinter(id: string) {
  return await setDefaultFn({ data: { id } });
}

export async function renamePrinter(id: string, displayName: string) {
  return await renameFn({ data: { id, displayName } });
}

export async function deletePrinter(id: string) {
  return await deleteFn({ data: { id } });
}
