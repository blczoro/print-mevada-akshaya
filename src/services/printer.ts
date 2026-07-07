import { API_CONFIG } from "@/config/api";
import type { Printer } from "@/types/print";

const MOCK_PRINTERS: Printer[] = [
  { id: "p-lobby-01", name: "Lobby Xerox C405", location: "Ground floor · Reception", status: "ready", supportsColor: true, supportsDuplex: true },
  { id: "p-lab-02",   name: "Lab HP LaserJet Pro", location: "2F · Research Lab",       status: "online", supportsColor: false, supportsDuplex: true },
  { id: "p-copy-03",  name: "Copy Room Canon iR", location: "3F · Copy Room",           status: "busy", supportsColor: true, supportsDuplex: true },
  { id: "p-photo-04", name: "Photo Epson SureColor", location: "Studio",                status: "ready", supportsColor: true, supportsDuplex: false },
  { id: "p-arch-05",  name: "Archive Brother HL", location: "Basement",                 status: "offline", supportsColor: false, supportsDuplex: false },
];

export async function fetchPrinters(): Promise<Printer[]> {
  if (API_CONFIG.useMockApi) {
    await delay(500);
    return MOCK_PRINTERS;
  }
  const res = await fetch(API_CONFIG.endpoints.listPrinters);
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

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }