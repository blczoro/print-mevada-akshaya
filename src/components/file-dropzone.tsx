import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME, MAX_FILE_SIZE } from "@/config/api";

interface Props {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
}

export function FileDropzone({ onFiles, multiple = true }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).filter((f) => {
        if (f.size > MAX_FILE_SIZE) return false;
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        return (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext);
      });
      if (files.length) onFiles(files);
    },
    [onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/40 px-6 py-14 text-center transition-all",
        "hover:border-primary/60 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dragging && "border-primary bg-accent/60 scale-[1.01]",
      )}
    >
      <div
        className="grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform group-hover:scale-105"
        style={{ background: "var(--gradient-hero)" }}
      >
        <UploadCloud className="h-6 w-6" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          Drop files here or <span className="text-primary underline-offset-4 group-hover:underline">browse</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, Word, PowerPoint, Excel, images, TXT · up to 50 MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={ACCEPTED_MIME}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}