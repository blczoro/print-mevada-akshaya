import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Printer as PrinterIcon, CheckCircle2, XCircle, RotateCcw, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { FileDropzone } from "@/components/file-dropzone";
import { FileList } from "@/components/file-list";
import { PrinterSelector } from "@/components/printer-selector";
import { PrintPreview } from "@/components/print-preview";
import { PrintSettingsPanel } from "@/components/print-settings-panel";
import { RecentJobs } from "@/components/recent-jobs";

import { uploadDocument } from "@/services/upload";
import { submitPrintJob, fetchJobStatus } from "@/services/print";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSharedFile } from "@/hooks/use-shared-file";
import { getSharedFilesFromIDB } from "@/lib/shared-file-idb";
import type { Printer, PrintJob, PrintSettings, UploadedFile } from "@/types/print";
import { DEFAULT_SETTINGS } from "@/types/print";

export const Route = createFileRoute("/")({
  component: PrintPage,
});

function PrintPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useLocalStorage<PrintSettings>("print-settings", DEFAULT_SETTINGS);
  const [printer, setPrinter] = useState<Printer | undefined>();
  const [job, setJob] = useState<PrintJob | undefined>();
  const [stage, setStage] = useState<"idle" | "sending" | "submitted">("idle");
  const [showSettings, setShowSettings] = useState(false);
  const [recent, setRecent] = useLocalStorage<PrintJob[]>("recent-jobs", []);

  const activeFile = files[0];
  const ready = !!activeFile && activeFile.status === "ready" && !!printer && printer.status !== "offline";

  useSharedFile((shared) => {
    setFiles((prev) => {
      prev.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      return [shared];
    });
    toast.success(`Loaded shared file: ${shared.name}`);
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSharedFilesFromIDB();
        if (cancelled || !data?.files?.length) return;
        const files = (data.files as unknown[]).filter(
          (f): f is File => f instanceof File && f.size > 0,
        );
        if (files.length) addFiles(files);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (incoming: File[]) => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    const first = incoming[0];
    if (!first) return;
    const uf: UploadedFile = {
      id: crypto.randomUUID(),
      file: first,
      name: first.name,
      size: first.size,
      progress: 0,
      status: "uploading",
    };
    setFiles([uf]);
    uploadDocument(first, (pct) =>
      setFiles((prev) => prev.map((x) => (x.id === uf.id ? { ...x, progress: pct } : x))),
    )
      .then((res) =>
        setFiles((prev) =>
          prev.map((x) =>
            x.id === uf.id
              ? { ...x, status: "ready", progress: 100, pageCount: res.pageCount, previewUrl: res.previewUrl }
              : x,
          ),
        ),
      )
      .catch((err) => {
        setFiles((prev) => prev.map((x) => (x.id === uf.id ? { ...x, status: "error", error: String(err.message ?? err) } : x)));
        toast.error(`Failed to upload ${uf.name}`);
      });
  };

  const removeFile = (id: string) =>
    setFiles((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t?.previewUrl) URL.revokeObjectURL(t.previewUrl);
      return prev.filter((x) => x.id !== id);
    });

  const submitMutation = useMutation({
    mutationFn: submitPrintJob,
    onSuccess: (created) => {
      setJob(created);
      setStage("submitted");
      setRecent([created, ...recent].slice(0, 10));
      toast.success("Print job sent");
    },
    onError: (err: Error) => {
      setStage("idle");
      toast.error(err.message || "Failed to submit");
    },
  });

  const handlePrint = () => {
    if (!activeFile || !printer) return;
    setStage("sending");
    submitMutation.mutate({ file: activeFile, printerId: printer.id, printerName: printer.name, settings });
  };

  const reset = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setJob(undefined);
    setStage("idle");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Print</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload, preview, pick a printer, hit print.</p>
      </div>

      {stage === "submitted" && job ? (
        <SubmissionScreen job={job} onReset={reset} onStatus={(s) => {
          setRecent((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: s } : j)));
        }} />
      ) : (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <Label>File</Label>
              <FileDropzone onFiles={addFiles} multiple={false} />
              <FileList files={files} onRemove={removeFile} />
              {activeFile && activeFile.status === "ready" && <PrintPreview file={activeFile} />}
            </div>

            <div className="space-y-3">
              <Label>Printer</Label>
              <PrinterSelector selectedId={printer?.id} onSelect={setPrinter} />
            </div>

            <Collapsible open={showSettings} onOpenChange={setShowSettings}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-left text-sm hover:bg-accent/40"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Settings2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Print settings</span>
                  </span>
                  <span className="shrink-0 text-right text-[11px] text-muted-foreground sm:text-xs">
                    {settings.copies}× · {settings.paperSize} · {settings.mode === "color" ? "Color" : "B&W"} ·{" "}
                    {settings.duplex === "double" ? "Duplex" : "Single"}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <PrintSettingsPanel settings={settings} onChange={setSettings} printer={printer} />
              </CollapsibleContent>
            </Collapsible>

            <Button
              className="w-full"
              size="lg"
              disabled={!ready || stage !== "idle"}
              onClick={handlePrint}
            >
              {stage === "sending" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
              ) : (
                <><PrinterIcon className="mr-2 h-4 w-4" />Print</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <RecentJobs jobs={recent} onClear={() => setRecent([])} />
    </div>
  );
}

function SubmissionScreen({
  job,
  onReset,
  onStatus,
}: {
  job: PrintJob;
  onReset: () => void;
  onStatus?: (s: PrintJob["status"]) => void;
}) {
  const [status, setStatus] = useState<PrintJob["status"]>(job.status);

  useEffect(() => {
    let cancelled = false;
    const terminal = new Set(["completed", "failed", "cancelled"]);
    const tick = async () => {
      try {
        const r = await fetchJobStatus(job.id);
        if (cancelled) return;
        setStatus(r.status);
        onStatus?.(r.status);
        if (!terminal.has(r.status)) setTimeout(tick, 2000);
      } catch {
        if (!cancelled) setTimeout(tick, 4000);
      }
    };
    const t = setTimeout(tick, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [job.id, onStatus]);

  const done = status === "completed";
  const failed = status === "failed" || status === "cancelled";

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        {done ? <CheckCircle2 className="h-14 w-14 text-success" /> :
          failed ? <XCircle className="h-14 w-14 text-destructive" /> :
          <Loader2 className="h-14 w-14 animate-spin text-primary" />}
        <div>
          <h2 className="text-xl font-bold">
            {done ? "Printed" : failed ? "Print failed" : "Sending to printer…"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{job.fileName} · {job.printerName}</p>
        </div>
        <Button onClick={onReset} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> Print another
        </Button>
      </CardContent>
    </Card>
  );
}
