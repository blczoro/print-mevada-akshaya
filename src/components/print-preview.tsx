import { FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrintSettings, UploadedFile } from "@/types/print";

interface Props {
  file?: UploadedFile;
  settings: PrintSettings;
}

export function PrintPreview({ file, settings }: Props) {
  const isLandscape = settings.orientation === "landscape";
  const aspect = isLandscape ? "aspect-[1.414/1]" : "aspect-[1/1.414]";
  const isImage = file?.file.type.startsWith("image/");
  const isPdf = file?.file.type === "application/pdf";

  return (
    <div className="grid place-items-center rounded-xl bg-muted/60 p-6">
      <div
        className={cn(
          "relative w-full max-w-[280px] overflow-hidden rounded-md border border-border bg-white shadow-[var(--shadow-elegant)] transition-all",
          aspect,
          settings.mode === "bw" && "grayscale",
        )}
      >
        {file?.previewUrl && isImage && (
          <img src={file.previewUrl} alt="preview" className="h-full w-full object-cover" />
        )}
        {file?.previewUrl && isPdf && (
          <iframe
            src={`${file.previewUrl}#toolbar=0&navpanes=0&view=FitH`}
            title="PDF preview"
            className="h-full w-full"
          />
        )}
        {!file?.previewUrl && (
          <div className="grid h-full w-full place-items-center text-slate-400">
            {isImage ? <ImageIcon className="h-10 w-10" /> : <FileText className="h-10 w-10" />}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {settings.paperSize} · {isLandscape ? "Landscape" : "Portrait"} · {settings.mode === "bw" ? "Black & White" : "Color"}
        {" · "}× {settings.copies}
      </p>
    </div>
  );
}