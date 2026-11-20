"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileQuestion, Loader2 } from "lucide-react";

type F = { id: string; name: string; mime: string };
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const kind = (f: F) =>
  f.mime === "application/pdf" ? "pdf"
    : f.mime.startsWith("image/") ? "image"
    : f.mime === DOCX || /\.docx$/i.test(f.name) ? "docx"
    : "other";

// Xem file ngay trong app: PDF (trình xem của trình duyệt), ảnh, Word .docx (render bằng docx-preview)
export function FilePreview({ file, onClose }: { file: F | null; onClose: () => void }) {
  return (
    <Dialog open={!!file} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[90vh] flex flex-col p-3 gap-2">
        <DialogHeader className="flex-row items-center gap-2 pr-8">
          <DialogTitle className="truncate text-base flex-1">{file?.name}</DialogTitle>
          {file && <Button variant="outline" size="sm" asChild><a href={`/api/files/${file.id}?download=1`}><Download /> Tải về</a></Button>}
        </DialogHeader>
        {file && <Body file={file} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({ file }: { file: F }) {
  const k = kind(file);
  const src = `/api/files/${file.id}`;
  if (k === "pdf") return <iframe src={src} className="flex-1 w-full rounded border" title={file.name} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (k === "image") return <div className="flex-1 min-h-0 flex items-center justify-center bg-zinc-100 rounded"><img src={src} alt={file.name} className="max-w-full max-h-full object-contain" /></div>;
  if (k === "docx") return <Docx src={src} />;
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-zinc-50 rounded">
      <FileQuestion className="size-10" />
      <p className="text-sm">Không xem trước được loại file này. Bấm “Tải về” để mở bằng ứng dụng trên máy.</p>
    </div>
  );
}

function Docx({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  useEffect(() => {
    let dead = false;
    setState("loading");
    (async () => {
      try {
        const [{ renderAsync }, buf] = await Promise.all([import("docx-preview"), fetch(src).then((r) => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })]);
        if (dead || !ref.current) return;
        ref.current.innerHTML = "";
        await renderAsync(buf, ref.current, undefined, { className: "docx", inWrapper: true, ignoreLastRenderedPageBreak: true });
        if (!dead) setState("ok");
      } catch { if (!dead) setState("error"); }
    })();
    return () => { dead = true; };
  }, [src]);
  return (
    <div className="relative flex-1 min-h-0 overflow-auto rounded border bg-zinc-100">
      {state === "loading" && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>}
      {state === "error" && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Không đọc được file Word này – bấm “Tải về”.</div>}
      <div ref={ref} className="[&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-4 [&_section.docx]:shadow-md [&_section.docx]:mx-auto" />
    </div>
  );
}
