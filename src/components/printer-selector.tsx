import { useQuery } from "@tanstack/react-query";
import { Printer as PrinterIcon, MapPin, Loader2, RefreshCw } from "lucide-react";
import { fetchPrinters } from "@/services/printer";
import type { Printer, PrinterStatus } from "@/types/print";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<PrinterStatus, string> = {
  ready: "bg-success/15 text-success",
  online: "bg-success/15 text-success",
  busy: "bg-warning/20 text-warning",
  offline: "bg-muted text-muted-foreground",
};

interface Props {
  selectedId?: string;
  onSelect: (p: Printer) => void;
}

export function PrinterSelector({ selectedId, onSelect }: Props) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["printers"],
    queryFn: fetchPrinters,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Detecting printers…" : `${data?.length ?? 0} printers available`}
        </p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid h-32 place-items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <ul className="space-y-2">
          {data?.map((p) => {
            const selected = p.id === selectedId;
            const disabled = p.status === "offline";
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(p)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    "hover:border-primary/60 hover:bg-accent/40",
                    selected
                      ? "border-primary bg-primary/5 shadow-[var(--shadow-elegant)]"
                      : "border-border bg-card",
                    disabled && "cursor-not-allowed opacity-60 hover:border-border hover:bg-card",
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <PrinterIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}