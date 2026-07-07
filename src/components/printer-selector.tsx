import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Printer as PrinterIcon,
  MapPin,
  Loader2,
  RefreshCw,
  Wifi,
  Cable,
  Usb,
  Star,
  Plus,
  Pencil,
  Trash2,
  PrinterCheck,
} from "lucide-react";
import { fetchPrinters } from "@/services/printer";
import type { Printer, PrinterConnection, PrinterStatus } from "@/types/print";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ManualPrinterDialog } from "@/components/manual-printer-dialog";
import { toast } from "sonner";

const STATUS_STYLES: Record<PrinterStatus, string> = {
  ready: "bg-success/15 text-success",
  online: "bg-success/15 text-success",
  busy: "bg-warning/20 text-warning",
  offline: "bg-muted text-muted-foreground",
};

const CONN_ICON: Record<PrinterConnection, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  ethernet: Cable,
  usb: Usb,
};

interface Props {
  selectedId?: string;
  onSelect: (p: Printer) => void;
}

export function PrinterSelector({ selectedId, onSelect }: Props) {
  const { data: discovered, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["printers"],
    queryFn: fetchPrinters,
  });

  const [manualPrinters, setManualPrinters] = useLocalStorage<Printer[]>(
    "swiftprint:manual-printers",
    [],
  );
  const [defaultId, setDefaultId] = useLocalStorage<string | null>(
    "swiftprint:default-printer",
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Printer | undefined>();

  const printers = useMemo<Printer[]>(
    () => [...(discovered ?? []), ...manualPrinters],
    [discovered, manualPrinters],
  );

  // Auto-select default on first load
  useEffect(() => {
    if (selectedId || !defaultId) return;
    const p = printers.find((x) => x.id === defaultId);
    if (p) onSelect(p);
  }, [defaultId, printers, selectedId, onSelect]);

  const openAdd = () => { setEditing(undefined); setDialogOpen(true); };
  const openEdit = (p: Printer) => { setEditing(p); setDialogOpen(true); };

  const saveManual = (p: Printer) => {
    setManualPrinters((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = p; return copy; }
      return [...prev, p];
    });
  };

  const removeManual = (id: string) => {
    setManualPrinters((prev) => prev.filter((x) => x.id !== id));
    if (defaultId === id) setDefaultId(null);
    toast("Printer removed");
  };

  const setDefault = (p: Printer) => {
    setDefaultId(p.id);
    toast.success(`${p.name} set as default`);
  };

  const empty = !isLoading && printers.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Scanning network for printers…"
            : `${printers.length} printer${printers.length === 1 ? "" : "s"} available`}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add manually
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid h-32 place-items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <PrinterCheck className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">No printers found</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              We couldn&apos;t discover any printers on your network.
            </p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" /> Add printer manually
          </Button>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {printers.map((p) => {
            const selected = p.id === selectedId;
            const disabled = p.status === "offline";
            const isDefault = defaultId === p.id;
            const ConnIcon = p.connection ? CONN_ICON[p.connection] : null;
            return (
              <li key={p.id}>
                <div
                  className={cn(
                    "group relative flex h-full flex-col gap-2 rounded-xl border p-3 transition-all",
                    selected
                      ? "border-primary bg-primary/5 shadow-[var(--shadow-elegant)]"
                      : "border-border bg-card hover:border-primary/60 hover:bg-accent/40",
                    disabled && "opacity-70",
                  )}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(p)}
                    className="flex items-start gap-3 text-left disabled:cursor-not-allowed"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                      <PrinterIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                        {isDefault && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                        {p.source === "manual" && (
                          <span className="rounded bg-muted px-1 py-px text-[10px] uppercase tracking-wide text-muted-foreground">manual</span>
                        )}
                      </div>
                      {p.model && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {p.manufacturer ? `${p.manufacturer} · ` : ""}{p.model}
                        </p>
                      )}
                      {p.location && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {p.location}
                        </p>
                      )}
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", STATUS_STYLES[p.status])}>
                      {p.status}
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[52px] text-[11px] text-muted-foreground">
                    {p.ipAddress && <span className="font-mono">{p.ipAddress}{p.port ? `:${p.port}` : ""}</span>}
                    {ConnIcon && <span className="inline-flex items-center gap-1 capitalize"><ConnIcon className="h-3 w-3" />{p.connection}</span>}
                    <span>{p.supportsColor ? "Color" : "B&W"}</span>
                    <span>{p.supportsDuplex ? "Duplex" : "Single-side"}</span>
                    {p.paperSizes && p.paperSizes.length > 0 && (
                      <span className="truncate">{p.paperSizes.join(" · ")}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 pl-[52px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setDefault(p)}
                      disabled={isDefault}
                    >
                      <Star className={cn("mr-1 h-3 w-3", isDefault && "fill-warning text-warning")} />
                      {isDefault ? "Default" : "Set default"}
                    </Button>
                    {p.source === "manual" && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(p)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => removeManual(p.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ManualPrinterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={saveManual}
        initial={editing}
      />
    </div>
  );
}