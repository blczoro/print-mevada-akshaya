import { FileText, ImageIcon, X, Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatBytes, fileExtension } from "@/lib/format";
import type { UploadedFile } from "@/types/print";

interface Props {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

export function FileList({ files, onRemove }: Props) {
  if (files.length === 0) return null;
  return (
    <ul className="space-y-2">
      {files.map((f) => (
        <li
          key={f.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] transition-colors"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            {f.file.type.startsWith("image/") ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                {fileExtension(f.name)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatBytes(f.size)}</span>
              {f.pageCount != null && <><span>·</span><span>{f.pageCount} pages</span></>}
              {f.status === "uploading" && <><span>·</span><span>Uploading…</span></>}
              {f.status === "ready" && <><span>·</span><span className="text-success">Ready</span></>}
              {f.status === "error" && <><span>·</span><span className="text-destructive">{f.error ?? "Error"}</span></>}
            </div>
            {f.status === "uploading" && (
              <Progress value={f.progress} className="mt-2 h-1.5" />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {f.status === "ready" && <Check className="h-4 w-4 text-success" />}
            {f.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button variant="ghost" size="icon" aria-label="Remove file" onClick={() => onRemove(f.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}