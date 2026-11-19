"use client";
import { useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DOC_TYPES } from "@/lib/constants";
import { fmtSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileText, Upload, X } from "lucide-react";

export type PendingFile = { file: File; docType: string };

export function FileDrop({ value, onChange, defaultDocType = DOC_TYPES[0] }: {
  value: PendingFile[]; onChange: (v: PendingFile[]) => void; defaultDocType?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const add = (list: FileList | null) => list && onChange([...value, ...Array.from(list).map((file) => ({ file, docType: defaultDocType }))]);

  return (
    <div className="space-y-2">
      <div
        role="button" tabIndex={0}
        onClick={() => ref.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        className={cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors text-sm",
          over ? "border-zinc-900 bg-zinc-100" : "border-zinc-300 hover:bg-zinc-50")}
      >
        <Upload className="size-6 mx-auto mb-1 text-zinc-500" />
        <div className="font-medium">Kéo thả file vào đây hoặc bấm để chọn</div>
        <div className="text-muted-foreground text-xs mt-1">PDF, ảnh, Word, Excel · tối đa 50MB / file</div>
        <input ref={ref} type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
          onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((p, i) => (
            <li key={i} className="flex items-center gap-2 border rounded-md p-2 bg-white">
              <FileText className="size-4 text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm">{p.file.name}</div>
                <div className="text-xs text-muted-foreground">{fmtSize(p.file.size)}</div>
              </div>
              <Select value={p.docType} onValueChange={(docType) => onChange(value.map((x, j) => (j === i ? { ...x, docType } : x)))}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(value.filter((_, j) => j !== i))}><X /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function toFormData(files: PendingFile[], data?: unknown) {
  const fd = new FormData();
  if (data !== undefined) fd.append("data", JSON.stringify(data));
  files.forEach((p) => fd.append("files", p.file));
  fd.append("docTypes", JSON.stringify(files.map((p) => p.docType)));
  return fd;
}
