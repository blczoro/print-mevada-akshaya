import { CheckCircle2, Clock, XCircle, Loader2, Printer as PrinterIcon } from "lucide-react";
import type { PrintJob } from "@/types/print";

interface Props {
  jobs: PrintJob[];
  onClear?: () => void;
}

function statusIcon(s: PrintJob["status"]) {
  if (s === "completed") return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  if (s === "failed" || s === "cancelled") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (s === "printing" || s === "sending") return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function RecentJobs({ jobs, onClear }: Props) {
  if (jobs.length === 0) return null;
  return (
    <div className="mt-6 rounded-xl border border-border bg-card/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent jobs</h3>
        {onClear && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>
      <ul className="divide-y divide-border/60">
        {jobs.slice(0, 8).map((j) => (
          <li key={j.id} className="flex items-center gap-3 py-2 text-sm">
            <PrinterIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{j.fileName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {j.printerName} · {new Date(j.createdAt).toLocaleString()}
              </p>
            </div>
            <span className="flex items-center gap-1 text-[11px] capitalize text-muted-foreground">
              {statusIcon(j.status)}
              {j.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
