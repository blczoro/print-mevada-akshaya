import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Printer as PrinterIcon, CheckCircle2, XCircle, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { FileDropzone } from "@/components/file-dropzone";
import { FileList } from "@/components/file-list";
import { PrintSettingsPanel } from "@/components/print-settings-panel";
import { PrinterSelector } from "@/components/printer-selector";
import { PrintPreview } from "@/components/print-preview";

import { uploadDocument } from "@/services/upload";
import { submitPrintJob } from "@/services/print";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type {
  Printer,
  PrintJob,
  PrintSettings,
  UploadedFile,
} from "@/types/print";
import { DEFAULT_SETTINGS } from "@/types/print";

export const Route = createFileRoute("/print")({
  head: () => ({
    meta: [
      { title: "Print a document — SwiftPrint" },
      { name: "description", content: "Upload a file, configure settings, and send it to a printer." },
      { property: "og:title", content: "Print a document — SwiftPrint" },
      { property: "og:description", content: "Upload, preview, and print in seconds." },
    ],
  }),
  component: PrintPage,
});

function PrintPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useLocalStorage<PrintSettings>(
    "swiftprint:last-settings",
    DEFAULT_SETTINGS,
  );
  const [printer, setPrinter] = useState<Printer | undefined>();
  const [job, setJob] = useState<PrintJob | undefined>();
  const [stage, setStage] = useState<"idle" | "preparing" | "sending" | "submitted">("idle");
  const [recentJobs, setRecentJobs] = useLocalStorage<PrintJob[]>("swiftprint:recent-jobs", []);

  const activeFile = files[0];
  const readyToPrint =
    !!activeFile && activeFile.status === "ready" && !!printer && printer.status !== "offline";

  // Auto-upload dropped files
  const addFiles = (incoming: File[]) => {
    const newOnes: UploadedFile[] = incoming.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "uploading",
    }));
    setFiles((prev) => [...prev, ...newOnes]);
    for (const uf of newOnes) {
      uploadDocument(uf.file, (pct) => {
        setFiles((prev) => prev.map((x) => (x.id === uf.id ? { ...x, progress: pct } : x)));
      })
        .then((res) => {
          setFiles((prev) =>
            prev.map((x) =>
              x.id === uf.id
                ? { ...x, status: "ready", progress: 100, pageCount: res.pageCount, previewUrl: res.previewUrl }
                : x,
            ),
          );
          toast.success(`Uploaded ${uf.name}`);
        })
        .catch((err) => {
          setFiles((prev) =>
            prev.map((x) => (x.id === uf.id ? { ...x, status: "error", error: String(err.message ?? err) } : x)),
          );
          toast.error(`Failed to upload ${uf.name}`);
        });
    }
  };

  const removeFile = (id: string) =>
    setFiles((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((x) => x.id !== id);
    });

  const submitMutation = useMutation({
    mutationFn: submitPrintJob,
    onSuccess: (created) => {
      setJob(created);
      setStage("submitted");
      setRecentJobs((prev) => [created, ...prev].slice(0, 5));
      toast.success(`Print job ${created.id} submitted`);
    },
    onError: (err: Error) => {
      setStage("idle");
      toast.error(err.message || "Failed to submit print job");
    },
  });

  const handlePrint = async () => {
    if (!activeFile || !printer) return;
    setStage("preparing");
    await new Promise((r) => setTimeout(r, 600));
    setStage("sending");
    submitMutation.mutate({
      file: activeFile,
      printerId: printer.id,
      printerName: printer.name,
      settings,
    });
  };

  const resetFlow = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setJob(undefined);
    setStage("idle");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Print a document</h1>
        <p className="mt-2 text-muted-foreground">
          Upload, tweak the settings, choose a printer, and go.
        </p>
      </div>

      {stage === "submitted" && job ? (
        <SubmissionScreen job={job} onReset={resetFlow} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileDropzone onFiles={addFiles} />
                <FileList files={files} onRemove={removeFile} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Print settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
                <PrintSettingsPanel
                  value={settings}
                  onChange={setSettings}
                  maxPages={activeFile?.pageCount}
                />
                <div>
                  <p className="mb-2 text-sm font-medium">Preview</p>
                  <PrintPreview file={activeFile} settings={settings} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Choose a printer</CardTitle>
              </CardHeader>
              <CardContent>
                <PrinterSelector selectedId={printer?.id} onSelect={setPrinter} />
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Ready to print</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SummaryRow label="File" value={activeFile?.name ?? "—"} />
                <SummaryRow label="Pages" value={pagesLabel(activeFile, settings)} />
                <SummaryRow label="Mode" value={settings.mode === "bw" ? "B&W" : "Color"} />
                <SummaryRow label="Duplex" value={settings.duplex === "double" ? "Double-sided" : "Single-sided"} />
                <SummaryRow label="Paper" value={`${settings.paperSize} · ${settings.orientation}`} />
                <SummaryRow label="Copies" value={String(settings.copies)} />
                <SummaryRow label="Printer" value={printer?.name ?? "—"} />
                <Separator />
                <Button
                  className="w-full shadow-[var(--shadow-elegant)]"
                  size="lg"
                  disabled={!readyToPrint || stage !== "idle"}
                  onClick={handlePrint}
                >
                  {stage === "preparing" && (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing document…</>)}
                  {stage === "sending" && (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending to printer…</>)}
                  {stage === "idle" && (<><PrinterIcon className="mr-2 h-4 w-4" />Print now</>)}
                </Button>
                {!readyToPrint && stage === "idle" && (
                  <p className="text-center text-xs text-muted-foreground">
                    {!activeFile ? "Upload a file to continue" : activeFile.status !== "ready" ? "Waiting for upload…" : "Select a printer to continue"}
                  </p>
                )}
              </CardContent>
            </Card>

            {recentJobs.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" /> Recent jobs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentJobs.map((j) => (
                    <div key={j.id} className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary" className="font-mono">{j.id}</Badge>
                      <span className="truncate text-muted-foreground">{j.fileName}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function pagesLabel(f: UploadedFile | undefined, s: PrintSettings): string {
  if (s.pageRangeMode === "custom" && s.pageRange) return s.pageRange;
  return f?.pageCount ? `All (${f.pageCount})` : "All";
}

function SubmissionScreen({ job, onReset }: { job: PrintJob; onReset: () => void }) {
  const [status, setStatus] = useState<PrintJob["status"]>(job.status);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStatus("printing"), 1500),
      setTimeout(() => setStatus("completed"), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [job.id]);

  const done = status === "completed";
  const failed = status === "failed" || status === "cancelled";

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        {done ? (
          <CheckCircle2 className="h-14 w-14 text-success" />
        ) : failed ? (
          <XCircle className="h-14 w-14 text-destructive" />
        ) : (
          <Loader2 className="h-14 w-14 animate-spin text-primary" />
        )}
        <div>
          <h2 className="text-2xl font-bold">
            {done ? "Print job completed" : failed ? "Print job failed" : "Print job submitted"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {done
              ? "Grab your pages from the printer."
              : failed
              ? "Something went wrong. Try again."
              : "Your document is on its way."}
          </p>
        </div>
        <div className="grid w-full max-w-sm gap-2 rounded-xl border border-border bg-muted/50 p-4 text-left text-sm">
          <Row k="Job ID" v={<code className="font-mono">{job.id}</code>} />
          <Row k="File" v={job.fileName} />
          <Row k="Printer" v={job.printerName} />
          <Row k="Status" v={<Badge variant={done ? "default" : failed ? "destructive" : "secondary"} className="capitalize">{status}</Badge>} />
        </div>
        <Button onClick={onReset} variant="outline" className="mt-2">
          <RotateCcw className="mr-2 h-4 w-4" /> Print another
        </Button>
      </CardContent>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate">{v}</span>
    </div>
  );
}