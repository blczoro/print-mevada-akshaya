import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PrintSettings, Printer, PaperSize, Orientation } from "@/types/print";

interface Props {
  settings: PrintSettings;
  onChange: (s: PrintSettings) => void;
  printer?: Printer;
}

const SIZES: PaperSize[] = ["A4", "A3", "Letter", "Legal", "Photo"];

export function PrintSettingsPanel({ settings, onChange, printer }: Props) {
  const set = <K extends keyof PrintSettings>(k: K, v: PrintSettings[K]) =>
    onChange({ ...settings, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="copies" className="text-xs">Copies</Label>
          <Input
            id="copies"
            type="number"
            min={1}
            max={99}
            value={settings.copies}
            onChange={(e) => set("copies", Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Paper</Label>
          <Select value={settings.paperSize} onValueChange={(v) => set("paperSize", v as PaperSize)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Orientation</Label>
          <Select value={settings.orientation} onValueChange={(v) => set("orientation", v as Orientation)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pages" className="text-xs">Pages</Label>
          <Input
            id="pages"
            placeholder="All"
            value={settings.pageRange}
            onChange={(e) => {
              const v = e.target.value;
              onChange({ ...settings, pageRange: v, pageRangeMode: v.trim() ? "custom" : "all" });
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch
            checked={settings.mode === "color"}
            onCheckedChange={(v) => set("mode", v ? "color" : "bw")}
            disabled={printer && !printer.supportsColor}
          />
          Color
          {printer && !printer.supportsColor && (
            <span className="text-[10px] text-muted-foreground">(not supported)</span>
          )}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch
            checked={settings.duplex === "double"}
            onCheckedChange={(v) => set("duplex", v ? "double" : "single")}
            disabled={printer && !printer.supportsDuplex}
          />
          Double-sided
          {printer && !printer.supportsDuplex && (
            <span className="text-[10px] text-muted-foreground">(not supported)</span>
          )}
        </label>
      </div>
    </div>
  );
}
