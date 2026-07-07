import { Minus, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { PrintSettings, PaperSize, Orientation, PrintMode, Duplex, Scaling } from "@/types/print";

interface Props {
  value: PrintSettings;
  onChange: (next: PrintSettings) => void;
  maxPages?: number;
}

export function PrintSettingsPanel({ value, onChange, maxPages }: Props) {
  const set = <K extends keyof PrintSettings>(k: K, v: PrintSettings[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-6">
      <Segmented
        label="Print mode"
        value={value.mode}
        onChange={(v) => set("mode", v as PrintMode)}
        options={[
          { value: "bw", label: "Black & White" },
          { value: "color", label: "Color" },
        ]}
      />

      <Segmented
        label="Duplex"
        value={value.duplex}
        onChange={(v) => set("duplex", v as Duplex)}
        options={[
          { value: "single", label: "Single-sided" },
          { value: "double", label: "Double-sided" },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Paper size</Label>
          <Select value={value.paperSize} onValueChange={(v) => set("paperSize", v as PaperSize)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["A4","A3","Letter","Legal","Photo"] as PaperSize[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Scaling</Label>
          <Select value={value.scaling} onValueChange={(v) => set("scaling", v as Scaling)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fit">Fit to page</SelectItem>
              <SelectItem value="actual">Actual size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Segmented
        label="Orientation"
        value={value.orientation}
        onChange={(v) => set("orientation", v as Orientation)}
        options={[
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ]}
      />

      <div className="space-y-2">
        <Label>Pages</Label>
        <RadioGroup
          value={value.pageRangeMode}
          onValueChange={(v) => set("pageRangeMode", v as PrintSettings["pageRangeMode"])}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="all" /> All {maxPages ? `(${maxPages})` : ""}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="custom" /> Custom
          </label>
        </RadioGroup>
        {value.pageRangeMode === "custom" && (
          <Input
            placeholder="e.g. 1-5, 8, 11-13"
            value={value.pageRange}
            onChange={(e) => set("pageRange", e.target.value)}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Copies</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Decrease copies"
            onClick={() => set("copies", Math.max(1, value.copies - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={1}
            max={999}
            value={value.copies}
            onChange={(e) => set("copies", Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
            className="w-20 text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Increase copies"
            onClick={() => set("copies", Math.min(999, value.copies + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SegmentedProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}
function Segmented({ label, value, onChange, options }: SegmentedProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              value === o.value
                ? "bg-background text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}