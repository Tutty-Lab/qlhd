"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./status-badge";
import { ContractForm } from "./contract-form";
import { FileDrop, toFormData, type PendingFile } from "./file-drop";
import { DOC_TYPES, TYPE_FIELDS } from "@/lib/constants";
import { api, fmtDate, fmtDateTime, fmtMoney, fmtSize, jsonInit, parseExtra, type ContractDetail, type ContractFile } from "@/lib/format";
import { ArrowLeft, Download, Eye, FileImage, FileText, Loader2, MoreHorizontal, Pencil, Trash2, Upload } from "lucide-react";

const ALL = "__all";
const isPreviewable = (m: string) => m === "application/pdf" || m.startsWith("image/");

export function ContractDetailView({ id, canEdit, canDelete }: { id: string; canEdit: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [c, setC] = useState<ContractDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState(ALL);
  const [preview, setPreview] = useState<ContractFile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [upOpen, setUpOpen] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; desc: string; run: () => Promise<void> }>(null);

  const load = useCallback(() => api<ContractDetail>(`/api/contracts/${id}`).then(setC).catch(() => setMissing(true)), [id]);
  useEffect(() => { load(); }, [load]);

  const files = useMemo(() => (c?.files || []).filter((f) => tab === ALL || f.docType === tab), [c, tab]);
  const counts = useMemo(() => Object.fromEntries(DOC_TYPES.map((t) => [t, (c?.files || []).filter((f) => f.docType === t).length])), [c]);

  if (missing) return <div className="text-center py-20 text-muted-foreground">Không tìm thấy hợp đồng. <Link href="/contracts" className="underline">Quay lại</Link></div>;
  if (!c) return <div className="space-y-4"><Skeleton className="h-10 w-80" /><Skeleton className="h-64" /></div>;

  async function upload() {
    setUploading(true);
    try {
      await api(`/api/contracts/${id}/files`, { method: "POST", body: toFormData(pending) });
      toast.success(`Đã tải lên ${pending.length} file`); setUpOpen(false); setPending([]); load();
    } catch (e) { toast.error((e as Error).message); } finally { setUploading(false); }
  }
  async function setStatus(status: string) {
    try { await api(`/api/contracts/${id}`, jsonInit("PATCH", { status })); toast.success("Đã cập nhật trạng thái"); load(); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function changeDocType(f: ContractFile, docType: string) {
    try { await api(`/api/contracts/${id}/files/${f.id}`, jsonInit("PATCH", { docType })); load(); }
    catch (e) { toast.error((e as Error).message); }
  }

  const ex = parseExtra(c.extra);
  const extraInfo: [string, React.ReactNode][] = (TYPE_FIELDS[c.type] || []).map((x) => [x.label,
    !ex[x.key] ? "" : x.kind === "money" ? fmtMoney(Number(ex[x.key])) + " đ" : x.kind === "date" ? fmtDate(ex[x.key])
      : <span className="whitespace-pre-wrap">{ex[x.key]}</span>]);
  const info: [string, React.ReactNode][] = [
    ["Loại", c.type], ["Chiều", c.direction],
    ["Đối tác", c.partner], ["Mã số thuế", c.partnerTax], ["Người đại diện", c.partnerRep], ["Địa chỉ", c.partnerAddress],
    ["Ngày ký", fmtDate(c.signDate)], ["Hiệu lực", [fmtDate(c.startDate), fmtDate(c.endDate)].filter(Boolean).join(" → ")],
    ["Giá trị trước VAT", c.value != null ? fmtMoney(c.value) + " đ" : ""],
    ["VAT", c.vat != null ? `${c.vat}%` : ""],
    ["Giá trị sau VAT", c.value != null ? fmtMoney(Math.round(c.value * (1 + (c.vat || 0) / 100))) + " đ" : ""],
    ["Người phụ trách", c.owner],
    ["Tag", c.tags ? <div className="flex flex-wrap gap-1">{c.tags.split(",").map((t) => <span key={t} className="bg-zinc-100 rounded px-1.5 text-xs">{t.trim()}</span>)}</div> : ""],
    ["Ghi chú", c.note ? <span className="whitespace-pre-wrap">{c.note}</span> : ""],
    ["Người tạo", `${c.createdBy} · ${fmtDateTime(c.createdAt)}`],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/contracts"><ArrowLeft /></Link></Button>
        <div className="mr-auto">
          <div className="flex items-center gap-2"><h1 className="text-xl font-semibold">{c.contractNo}</h1><StatusBadge status={c.status} endDate={c.endDate} /></div>
          <div className="text-sm text-muted-foreground">{c.title || c.partner}</div>
        </div>
        {canEdit && <>
          <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil /> Sửa</Button>
          <Button onClick={() => { setPending([]); setUpOpen(true); }}><Upload /> Tải file lên</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {c.status !== "ACTIVE" && <DropdownMenuItem onSelect={() => setStatus("ACTIVE")}>Đặt lại: Đang hiệu lực</DropdownMenuItem>}
              {c.status !== "DONE" && <DropdownMenuItem onSelect={() => setStatus("DONE")}>Đánh dấu Đã thanh lý</DropdownMenuItem>}
              {c.status !== "CANCEL" && <DropdownMenuItem onSelect={() => setStatus("CANCEL")}>Đánh dấu Huỷ</DropdownMenuItem>}
              {canDelete && <><DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({
                  title: "Xoá hợp đồng?", desc: `Hợp đồng ${c.contractNo} và toàn bộ ${c.files.length} file sẽ bị xoá vĩnh viễn, không khôi phục được.`,
                  run: async () => { await api(`/api/contracts/${id}`, { method: "DELETE" }); toast.success("Đã xoá hợp đồng"); router.push("/contracts"); },
                })}><Trash2 /> Xoá hợp đồng</DropdownMenuItem></>}
            </DropdownMenuContent>
          </DropdownMenu>
        </>}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <Card className="gap-0 p-0 overflow-hidden">
          <div className="p-4 border-b overflow-x-auto">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value={ALL}>Tất cả ({c.files.length})</TabsTrigger>
                {DOC_TYPES.map((t) => <TabsTrigger key={t} value={t}>{t}{counts[t] ? ` (${counts[t]})` : ""}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>
          {!files.length ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Chưa có file{tab !== ALL ? ` "${tab}"` : ""}.
              {canEdit && <div className="mt-3"><Button variant="outline" size="sm" onClick={() => { setPending([]); setUpOpen(true); }}><Upload /> Tải file lên</Button></div>}
            </div>
          ) : (
            <ul className="divide-y">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`size-10 rounded-md flex items-center justify-center shrink-0 ${f.mime === "application/pdf" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-600"}`}>
                    {f.mime.startsWith("image/") ? <FileImage className="size-5" /> : <FileText className="size-5" />}
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <button className="truncate text-sm font-medium hover:underline text-left max-w-full block" onClick={() => isPreviewable(f.mime) ? setPreview(f) : window.open(`/api/files/${f.id}?download=1`)}>{f.name}</button>
                    <div className="text-xs text-muted-foreground">{fmtSize(f.size)} · {f.uploadedBy} · {fmtDateTime(f.createdAt)}</div>
                  </div>
                  {canEdit ? (
                    <Select value={f.docType} onValueChange={(v) => changeDocType(f, v)}>
                      <SelectTrigger size="sm" className="w-44 hidden md:flex"><SelectValue /></SelectTrigger>
                      <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <span className="text-xs bg-zinc-100 rounded px-2 py-0.5 hidden md:inline">{f.docType}</span>}
                  {isPreviewable(f.mime) && <Button variant="ghost" size="icon-sm" title="Xem" onClick={() => setPreview(f)}><Eye /></Button>}
                  <Button variant="ghost" size="icon-sm" title="Tải về" asChild><a href={`/api/files/${f.id}?download=1`}><Download /></a></Button>
                  {canDelete && <Button variant="ghost" size="icon-sm" title="Xoá" className="text-destructive" onClick={() => setConfirm({
                    title: "Xoá file?", desc: `File "${f.name}" sẽ bị xoá vĩnh viễn.`,
                    run: async () => { await api(`/api/contracts/${id}/files/${f.id}`, { method: "DELETE" }); toast.success("Đã xoá file"); load(); },
                  })}><Trash2 /></Button>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Thông tin hợp đồng</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
                {info.filter(([, v]) => v).map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>))}
              </dl>
            </CardContent>
          </Card>
          {extraInfo.some(([, v]) => v) && (
            <Card>
              <CardHeader><CardTitle>Thông tin riêng · {c.type}</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
                  {extraInfo.filter(([, v]) => v).map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>))}
                </dl>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Lịch sử</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {c.history.map((h) => (
                  <li key={h.id} className="border-l-2 pl-3">
                    <div><b>{h.by}</b> · {h.action}</div>
                    {h.note && <div className="text-muted-foreground text-xs">{h.note}</div>}
                    <div className="text-xs text-muted-foreground">{fmtDateTime(h.at)}</div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <ContractForm open={editOpen} onOpenChange={setEditOpen} contract={c} onSaved={() => load()} />

      <Dialog open={upOpen} onOpenChange={setUpOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Tải file lên · {c.contractNo}</DialogTitle></DialogHeader>
          <FileDrop value={pending} onChange={setPending} defaultDocType={tab === ALL ? DOC_TYPES[0] : tab} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpOpen(false)}>Huỷ</Button>
            <Button onClick={upload} disabled={!pending.length || uploading}>{uploading && <Loader2 className="animate-spin" />}Tải lên {pending.length || ""} file</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="sm:max-w-5xl w-[95vw] h-[90vh] flex flex-col p-3 gap-2">
          <DialogHeader className="flex-row items-center gap-2 pr-8">
            <DialogTitle className="truncate text-base flex-1">{preview?.name}</DialogTitle>
            {preview && <Button variant="outline" size="sm" asChild><a href={`/api/files/${preview.id}?download=1`}><Download /> Tải về</a></Button>}
          </DialogHeader>
          {preview && (preview.mime.startsWith("image/")
            // eslint-disable-next-line @next/next/no-img-element
            ? <div className="flex-1 min-h-0 flex items-center justify-center bg-zinc-100 rounded"><img src={`/api/files/${preview.id}`} alt={preview.name} className="max-w-full max-h-full object-contain" /></div>
            : <iframe src={`/api/files/${preview.id}`} className="flex-1 w-full rounded border" title={preview.name} />)}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirm?.title}</AlertDialogTitle><AlertDialogDescription>{confirm?.desc}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              try { await confirm?.run(); } catch (e) { toast.error((e as Error).message); } setConfirm(null);
            }}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
