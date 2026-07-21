import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, KeyRound, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiKeyStatus, saveApiKey } from "@/lib/printnode.functions";

export const Route = createFileRoute("/api-settings")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }, { title: "API settings" }] }),
  component: ApiSettings,
});

function ApiSettings() {
  const getStatus = useServerFn(getApiKeyStatus);
  const save = useServerFn(saveApiKey);
  const [status, setStatus] = useState<{ configured: boolean; masked: string } | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStatus().then(setStatus).catch(() => setStatus({ configured: false, masked: "" }));
  }, [getStatus]);

  const onSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await save({ data: { apiKey: value.trim() } });
      toast.success("API key saved and verified");
      setValue("");
      const s = await getStatus();
      setStatus(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to printer
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> PrintNode API key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Current: </span>
            {status === null ? (
              <span className="text-muted-foreground">Loading…</span>
            ) : status.configured ? (
              <span className="font-mono">{status.masked}</span>
            ) : (
              <span className="text-destructive">Not configured</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">New API key</Label>
            <Input
              id="apiKey"
              type="password"
              autoComplete="off"
              placeholder="Paste your PrintNode API key"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Saved securely. The key is verified with PrintNode before being stored.
            </p>
          </div>

          <Button onClick={onSave} disabled={!value.trim() || saving} className="w-full">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save & verify</>}
          </Button>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            This page is unlisted — reach it by typing <code>/api-settings</code> in the URL.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
