"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NdaCreateButton } from "./nda-create-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DOC_TYPES } from "@/lib/constants";
import { api, fmtDateTime, fmtSize, type DocumentRow } from "@/lib/format";
import { Download, Eye, FileImage, FileText, Filter, Search } from "lucide-react";

const ALL = "__all";
const PAGE = 50;
const NDA = "Thỏa thuận bảo mật";
type DocumentPage = { items: DocumentRow[]; total: number; counts: Record<string, number>; all: number; loading?: boolean };
const EMPTY: DocumentPage = { items: [], total: 0, counts: {}, all: 0 };

export function DocumentList({ canEdit }: { canEdit: boolean }) {
  const params = useSearchParams();
  const [res, setRes] = useState<DocumentPage | null>(null);
  const [tab, setTab] = useState(params.get("type") || ALL);
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  useEffect(() => { setTab(params.get("type") || ALL); setPage(1); }, [params]);
  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    const ctl = new AbortController();
    const sp = new URLSearchParams({ page: String(page), limit: String(PAGE) });
    if (tab !== ALL) sp.set("type", tab);
    if (dq) sp.set("q", dq);
    setRes((r) => (r ? { ...r, loading: true } : r));
    api<DocumentPage>("/api/documents?" + sp, { signal: ctl.signal }).then(setRes).catch((e) => { if (e?.name !== "AbortError") setRes(EMPTY); });
    return () => ctl.abort();
  }, [tab, dq, page, tick]);

  const list = res?.items || [];
  const pages = res ? Math.max(1, Math.ceil(res.total / PAGE)) : 1;
  const count = (t: string) => res?.counts[t] ?? 0;

  return (
    <div className="space-y-4">
      <Card className="p-0 gap-0 overflow-hidden">
        <div className="p-3 border-b flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" placeholder="Tìm tên file, số hợp đồng, đối tác..." />
          </div>
          <Select value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[230px] bg-white"><Filter className="size-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả loại ({res?.all ?? 0})</SelectItem>
              {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t} ({count(t)})</SelectItem>)}
            </SelectContent>
          </Select>
          {canEdit && tab === NDA && <NdaCreateButton onCreated={() => setTick((t) => t + 1)} />}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tên file</TableHead><TableHead>Loại</TableHead><TableHead>Hợp đồng</TableHead>
              <TableHead>Người tải</TableHead><TableHead>Thời gian</TableHead><TableHead className="text-right">Thao tác</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {!res && Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6" /></TableCell></TableRow>)}
              {res && !list.length && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Không có tài liệu</TableCell></TableRow>}
              {list.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="max-w-[360px]">
                    <div className="flex items-center gap-2">
                      {f.mime.startsWith("image/") ? <FileImage className="size-4 text-zinc-500 shrink-0" /> : <FileText className="size-4 text-red-500 shrink-0" />}
                      <span className="truncate">{f.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-6">{fmtSize(f.size)}</div>
                  </TableCell>
                  <TableCell><span className="text-xs bg-zinc-100 rounded px-2 py-0.5 whitespace-nowrap">{f.docType}</span></TableCell>
                  <TableCell>
                    <Link href={`/contracts/${f.contract.id}`} className="font-medium hover:underline">{f.contract.contractNo}</Link>
                    <div className="text-xs text-muted-foreground truncate max-w-[240px]">{f.contract.partner}</div>
                  </TableCell>
                  <TableCell>{f.uploadedBy}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDateTime(f.createdAt)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon-sm" asChild title="Xem"><a href={`/api/files/${f.id}`} target="_blank"><Eye /></a></Button>
                    <Button variant="ghost" size="icon-sm" asChild title="Tải về"><a href={`/api/files/${f.id}?download=1`}><Download /></a></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className={`px-4 py-3 border-t text-sm text-muted-foreground flex items-center justify-between gap-2 ${res?.loading ? "opacity-60" : ""}`}>
          <span>{res?.total ?? 0} tài liệu</span>
          {pages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
              <span className="tabular-nums">{page}/{pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
