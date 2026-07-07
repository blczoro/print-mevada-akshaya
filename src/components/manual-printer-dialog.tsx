import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Plug } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { testPrinterConnection } from "@/services/printer";
import type {
  ManualPrinterInput,
  Printer,
  PrinterConnection,
  PrinterProtocol,
  PrinterTestResult,
} from "@/types/print";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (p: Printer) => void;
  initial?: Printer;
}

const DEFAULT: ManualPrinterInput = {
  name: "",
  address: "",
  port: 9100,
  protocol: "RAW",
  connection: "ethernet",
};

export function ManualPrinterDialog({ open, onOpenChange, onSave, initial }: Props) {
  const [form, setForm] = useState<ManualPrinterInput>(() =>
    initial
      ? {
          name: initial.name,
          address: initial.ipAddress ?? initial.hostname ?? "",
          port: initial.port ?? 9100,
          protocol: initial.protocol ?? "RAW",
          connection: initial.connection ?? "ethernet",
        }
      : DEFAULT,
  );
  const [result, setResult] = useState<PrinterTestResult | null>(null);

  const update = <K extends keyof ManualPrinterInput>(k: K, v: ManualPrinterInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setResult(null);
  };

  const testMutation = useMutation({
    mutationFn: () => testPrinterConnection(form),
    onSuccess: (r) => setResult(r),
    onError: (e: Error) => setResult({ ok: false, reason: "error", message: e.message }),
  });

  const handleSave = () => {
    if (result?.ok) {
      onSave({ ...result.printer, name: form.name || result.printer.name });
      toast.success(`Saved ${result.printer.name}`);
      onOpenChange(false);
      return;
    }
    // Save unverified — mark offline until tested
    const printer: Printer = {
      id: initial?.id ?? `manual-${Date.now()}`,
      name: form.name || `Printer @ ${form.address}`,
      ipAddress: form.address,
      port: form.port,
      protocol: form.protocol,
      connection: form.connection,
      status: "offline",
      supportsColor: false,
      supportsDuplex: false,
      source: "manual",
    };
    onSave(printer);
    toast("Printer saved (untested)");
    onOpenChange(false);
  };

  const canSubmit = form.address.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit printer" : "Add printer manually"}</DialogTitle>
          <DialogDescription>
            Enter the printer&apos;s network details. Test the connection to auto-fill capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="mp-name">Printer name</Label>
            <Input
              id="mp-name"
              placeholder="Office printer"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="mp-addr">IP address or hostname</Label>
              <Input
                id="mp-addr"
                placeholder="192.168.1.50"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mp-port">Port</Label>
              <Input
                id="mp-port"
                type="number"
                inputMode="numeric"
                value={form.port}
                onChange={(e) => update("port", Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Protocol</Label>
              <Select
                value={form.protocol}
                onValueChange={(v) => {
                  const proto = v as PrinterProtocol;
                  update("protocol", proto);
                  update("port", proto === "IPP" ? 631 : proto === "LPR" ? 515 : 9100);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IPP">IPP (631)</SelectItem>
                  <SelectItem value="RAW">RAW / JetDirect (9100)</SelectItem>
                  <SelectItem value="LPR">LPR (515)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Connection type</Label>
              <Select
                value={form.connection}
                onValueChange={(v) => update("connection", v as PrinterConnection)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wifi">Wi-Fi</SelectItem>
                  <SelectItem value="ethernet">Ethernet</SelectItem>
                  <SelectItem value="usb">USB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {result && (
            <div
              className={
                "rounded-lg border p-3 text-sm " +
                (result.ok
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-destructive/40 bg-destructive/10 text-destructive")
              }
            >
              <div className="flex items-center gap-2 font-medium">
                {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {result.ok ? "Connected successfully" : labelForReason(result.reason)}
              </div>
              {result.ok ? (
                <ul className="mt-2 grid gap-0.5 text-xs text-foreground/80">
                  <li>Model: {result.printer.model}</li>
                  <li>Manufacturer: {result.printer.manufacturer}</li>
                  <li>Color: {result.printer.supportsColor ? "Yes" : "No"}</li>
                  <li>Duplex: {result.printer.supportsDuplex ? "Yes" : "No"}</li>
                  <li>Paper: {result.printer.paperSizes?.join(", ")}</li>
                  <li>Status: {result.printer.status}</li>
                </ul>
              ) : (
                <p className="mt-1 text-xs opacity-90">{result.message}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={!canSubmit || testMutation.isPending}
          >
            {testMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing…</>
            ) : (
              <><Plug className="mr-2 h-4 w-4" />Test connection</>
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSubmit}>Save printer</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function labelForReason(reason: "not_found" | "timeout" | "auth_required" | "error"): string {
  switch (reason) {
    case "not_found": return "Printer not found";
    case "timeout": return "Connection timed out";
    case "auth_required": return "Authentication required";
    default: return "Connection failed";
  }
}