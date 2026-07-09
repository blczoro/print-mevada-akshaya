import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Printer as PrinterIcon,
  MapPin,
  Loader2,
  RefreshCw,
  Wifi,
  Cable,
  Usb,
  Bluetooth,
  HelpCircle,
  Star,
  Pencil,
  Trash2,
  PrinterCheck,
  AlertCircle,
} from "lucide-react";
import {
  fetchPrinters,
  discoverPrinters,
  setDefaultPrinter,
  renamePrinter,
  deletePrinter,
} from "@/services/printer";
import type { Printer, PrinterConnection, PrinterStatus } from "@/types/print";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  bluetooth: Bluetooth,
  unknown: HelpCircle,
};

interface Props {
  selectedId?: string;
  onSelect: (p: Printer) => void;
}

export function PrinterSelector({ selectedId, onSelect }: Props) {
  const qc = useQueryClient();
  const { data: printers, isLoading, error } = useQuery({
    queryKey: ["printers"],
    queryFn: fetchPrinters,
  });

  const discoverMut = useMutation({
    mutationFn: discoverPrinters,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["printers"] });
      toast.success(`Discovered ${r.discovered} printer${r.discovered === 1 ? "" : "s"}`);
    },
    onError: (e: Error) => toast.error(e.message || "Discovery failed"),
  });

  const setDefaultMut = useMutation({
    mutationFn: setDefaultPrinter,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["printers"] }),
  });

  const deleteMut = useMutation({
    mutationFn: deletePrinter,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["printers"] });
      toast("Printer removed from your list");
    },
  });

  const [renaming, setRenaming] = useState<Printer | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const renameMut = useMutation({
    mutationFn: (v: { id: string; displayName: string }) => renamePrinter(v.id, v.displayName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["printers"] });
      setRenaming(null);
      toast.success("Renamed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-discover on first mount (if empty)
  useEffect(() => {
    if (!isLoading && printers && printers.length === 0 && !discoverMut.isPending) {
      discoverMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Auto-select default
  useEffect(() => {
    if (selectedId || !printers) return;
    const def = printers.find((p) => p.isDefault);
    if (def) onSelect(def);
  }, [printers, selectedId, onSelect]);

  const list = printers ?? [];
  const empty = !isLoading && list.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {isLoading || discoverMut.isPending
            ? "Scanning for printers…"
            : `${list.length} printer${list.length === 1 ? "" : "s"} available`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => discoverMut.mutate()}
          disabled={discoverMut.isPending}
        >
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", discoverMut.isPending && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Couldn't load printers</p>
            <p className="text-xs opacity-90">{(error as Error).message}</p>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid h-32 place-items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <PrinterCheck className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">No printers connected yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground max-w-sm">
              Install the free PrintNode client on any computer with a printer, sign in, and it will
              appear here automatically.
            </p>
          </div>
          <a
            href="https://www.printnode.com/en/download"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-primary underline underline-offset-2"
          >
            Get the PrintNode client →
          </a>
          <Button size="sm" onClick={() => discoverMut.mutate()} disabled={discoverMut.isPending}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", discoverMut.isPending && "animate-spin")} />
            Scan again
          </Button>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map((p) => {
            const selected = p.id === selectedId;
            const disabled = p.status === "offline";
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
                        {p.isDefault && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                      </div>
                      {p.computerName && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {p.computerName}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                        STATUS_STYLES[p.status],
                      )}
                    >
                      {p.status}
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[52px] text-[11px] text-muted-foreground">
                    {ConnIcon && (
                      <span className="inline-flex items-center gap-1 capitalize">
                        <ConnIcon className="h-3 w-3" />
                        {p.connection}
                      </span>
                    )}
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
                      onClick={() => setDefaultMut.mutate(p.id)}
                      disabled={!!p.isDefault || setDefaultMut.isPending}
                    >
                      <Star className={cn("mr-1 h-3 w-3", p.isDefault && "fill-warning text-warning")} />
                      {p.isDefault ? "Default" : "Set default"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setRenaming(p);
                        setRenameValue(p.name);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => deleteMut.mutate(p.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename printer</DialogTitle>
            <DialogDescription>Give this printer a friendlier name to show in the list.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="e.g. Reception color printer"
            maxLength={120}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                renaming && renameMut.mutate({ id: renaming.id, displayName: renameValue.trim() })
              }
              disabled={!renameValue.trim() || renameMut.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
