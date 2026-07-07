import { API_CONFIG } from "@/config/api";
import type {
  ManualPrinterInput,
  Printer,
  PrinterTestResult,
} from "@/types/print";

const MOCK_PRINTERS: Printer[] = [
  {
    id: "p-lobby-01", name: "Lobby Xerox C405", model: "VersaLink C405",
    manufacturer: "Xerox", location: "Ground floor · Reception",
    ipAddress: "192.168.1.21", port: 631, protocol: "IPP", connection: "ethernet",
    status: "ready", supportsColor: true, supportsDuplex: true,
    paperSizes: ["A4", "A3", "Letter", "Legal"], source: "auto",
  },
  {
    id: "p-lab-02", name: "Lab HP LaserJet Pro", model: "LaserJet Pro M404dn",
    manufacturer: "HP", location: "2F · Research Lab",
    ipAddress: "192.168.1.34", port: 9100, protocol: "RAW", connection: "wifi",
    status: "online", supportsColor: false, supportsDuplex: true,
    paperSizes: ["A4", "Letter", "Legal"], source: "auto",
  },
  {
    id: "p-copy-03", name: "Copy Room Canon iR", model: "imageRUNNER 2645i",
    manufacturer: "Canon", location: "3F · Copy Room",
    ipAddress: "192.168.1.42", port: 631, protocol: "IPP", connection: "ethernet",
    status: "busy", supportsColor: true, supportsDuplex: true,
    paperSizes: ["A4", "A3", "Letter", "Legal"], source: "auto",
  },
  {
    id: "p-photo-04", name: "Photo Epson SureColor", model: "SureColor P700",
    manufacturer: "Epson", location: "Studio",
    ipAddress: "192.168.1.55", port: 9100, protocol: "RAW", connection: "usb",
    status: "ready", supportsColor: true, supportsDuplex: false,
    paperSizes: ["A4", "A3", "Photo"], source: "auto",
  },
];

export async function fetchPrinters(): Promise<Printer[]> {
  if (API_CONFIG.useMockApi) {
    await delay(700);
    return MOCK_PRINTERS;
  }
  const res = await fetch(API_CONFIG.endpoints.discoverPrinters);
  if (!res.ok) throw new Error("Failed to fetch printers");
  return res.json();
}

export async function fetchPrinterStatus(id: string): Promise<{ status: Printer["status"] }> {
  if (API_CONFIG.useMockApi) {
    await delay(200);
    const p = MOCK_PRINTERS.find((x) => x.id === id);
    return { status: p?.status ?? "offline" };
  }
  const res = await fetch(API_CONFIG.endpoints.printerStatus(id));
  if (!res.ok) throw new Error("Failed to fetch printer status");
  return res.json();
}

export async function testPrinterConnection(input: ManualPrinterInput): Promise<PrinterTestResult> {
  if (API_CONFIG.useMockApi) {
    await delay(1200);
    const addr = input.address.trim().toLowerCase();
    if (!addr) return { ok: false, reason: "not_found", message: "Printer not found on the network." };
    if (addr.includes("timeout")) return { ok: false, reason: "timeout", message: "Connection timed out." };
    if (addr.includes("auth")) return { ok: false, reason: "auth_required", message: "Authentication required." };
    if (addr.endsWith(".999") || addr === "0.0.0.0") {
      return { ok: false, reason: "not_found", message: "Printer not found at this address." };
    }
    const printer: Printer = {
      id: `manual-${Date.now()}`,
      name: input.name || `Printer @ ${input.address}`,
      model: "Generic PostScript",
      manufacturer: "Generic",
      ipAddress: input.address,
      hostname: input.address,
      port: input.port,
      protocol: input.protocol,
      connection: input.connection,
      status: "ready",
      supportsColor: true,
      supportsDuplex: true,
      paperSizes: ["A4", "Letter", "Legal"],
      source: "manual",
    };
    return { ok: true, printer };
  }
  const res = await fetch(API_CONFIG.endpoints.testPrinter, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to test printer");
  return res.json();
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }