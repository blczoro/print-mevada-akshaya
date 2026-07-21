import { FileText, ImageIcon, FileType2 } from "lucide-react";
import type { UploadedFile } from "@/types/print";
import { formatBytes, fileExtension } from "@/lib/format";

interface Props {
  file: UploadedFile;
}

export function PrintPreview({ file }: Props) {
  const type = file.file.type;
  const isImage = type.startsWith("image/");
  const isPdf = type === "application/pdf";
  const isText = type.startsWith("text/") || /\.(txt|md|csv|log)$/i.test(file.name);
  const url = file.previewUrl ?? (isImage || isPdf || isText ? URL.createObjectURL(file.file) : undefined);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-3 py-2 text-xs text-muted-foreground">
        <span className="truncate">{file.name}</span>
        <span>{formatBytes(file.size)}{file.pageCount ? ` · ${file.pageCount}p` : ""}</span>
      </div>
      <div className="grid h-64 place-items-center bg-background">
        {isImage && url ? (
          <img src={url} alt={file.name} className="h-full w-full object-contain" />
        ) : isPdf && url ? (
          <iframe title={file.name} src={`${url}#view=FitH`} className="h-full w-full" />
        ) : isText && url ? (
          <iframe title={file.name} src={url} className="h-full w-full bg-white" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {/\.(docx?|pptx?|xlsx?)$/i.test(file.name) ? (
              <FileType2 className="h-10 w-10" />
            ) : isImage ? (
              <ImageIcon className="h-10 w-10" />
            ) : (
              <FileText className="h-10 w-10" />
            )}
            <p className="text-sm font-medium text-foreground">{fileExtension(file.name)} file</p>
            <p className="max-w-xs text-center text-xs">
              Inline preview isn't supported for this file type. It will still be sent to the printer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
