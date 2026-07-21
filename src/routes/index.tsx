import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Printer as PrinterIcon, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { FileDropzone } from "@/components/file-dropzone";
import { FileList } from "@/components/file-list";
import { PrinterSelector } from "@/components/printer-selector";

import { uploadDocument } from "@/services/upload";
import { submitPrintJob, fetchJobStatus } from "@/services/print";
import type { Printer, PrintJob, PrintSettings, UploadedFile } from "@/types/print";
import { DEFAULT_SETTINGS } from "@/types/print";

export const Route = createFileRoute("/")({
  component: PrintPage,
});

function PrintPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState(false);
  const [duplex, setDuplex] = useState(false);
  const [printer, setPrinter] = useState<Printer | undefined>();
  const [job, setJob] = useState<PrintJob | undefined>();
  const [stage, setStage] = useState<"idle" | "sending" | "submitted">("idle");

  const activeFile = files[0];
  const ready = !!activeFile && activeFile.status === "ready" && !!printer && printer.status !== "offline";

  const addFiles = (incoming: File[]) => {
    // Only keep the most recent file for simplicity
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
      toast.success("Print job sent");
    },
    onError: (err: Error) => {
      setStage("idle");
      toast.error(err.message || "Failed to submit");
    },
  });

  const handlePrint = () => {
    if (!activeFile || !printer) return;
    const settings: PrintSettings = {
      ...DEFAULT_SETTINGS,
      mode: color ? "color" : "bw",
      duplex: duplex ? "double" : "single",
      copies: Math.max(1, Math.min(99, copies)),
    };
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
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Print</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload a PDF or image, pick a printer, hit print.</p>
      </div>

      {stage === "submitted" && job ? (
        <SubmissionScreen job={job} onReset={reset} />
      ) : (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <Label>File</Label>
              <FileDropzone onFiles={addFiles} />
              <FileList files={files} onRemove={removeFile} />
            </div>

            <div className="space-y-3">
              <Label>Printer</Label>
              <PrinterSelector selectedId={printer?.id} onSelect={setPrinter} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="copies">Copies</Label>
                <Input
                  id="copies"
                  type="number"
                  min={1}
                  max={99}
                  value={copies}
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <Label htmlFor="color" className="text-sm">Color</Label>
                <Switch id="color" checked={color} onCheckedChange={setColor} disabled={!printer?.supportsColor} />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <Label htmlFor="duplex" className="text-sm">Double-sided</Label>
                <Switch id="duplex" checked={duplex} onCheckedChange={setDuplex} disabled={!printer?.supportsDuplex} />
              </div>
            </div>

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
    </div>
  );
}

function SubmissionScreen({ job, onReset }: { job: PrintJob; onReset: () => void }) {
  const [status, setStatus] = useState<PrintJob["status"]>(job.status);

  useEffect(() => {
    let cancelled = false;
    const terminal = new Set(["completed", "failed", "cancelled"]);
    const tick = async () => {
      try {
        const r = await fetchJobStatus(job.id);
        if (cancelled) return;
        setStatus(r.status);
        if (!terminal.has(r.status)) setTimeout(tick, 2000);
      } catch {
        if (!cancelled) setTimeout(tick, 4000);
      }
    };
    const t = setTimeout(tick, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [job.id]);

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
