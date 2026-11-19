"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DOC_TYPES } from "@/lib/constants";
import { api, fmtDateTime, fmtSize, noAccent, type DocumentRow } from "@/lib/format";
import { Download, Eye, FileImage, FileText, Search } from "lucide-react";

const ALL = "__all";

export function DocumentList() {
  const params = useSearchParams();
  const [docs, setDocs] = useState<DocumentRow[] | null>(null);
  const [tab, setTab] = useState(params.get("type") || ALL);
  const [q, setQ] = useState("");
  useEffect(() => { api<DocumentRow[]>("/api/documents").then(setDocs).catch(() => setDocs([])); }, []);
  useEffect(() => { setTab(params.get("type") || ALL); }, [params]);

  const list = useMemo(() => {
    const nq = noAccent(q.trim());
    return (docs || []).filter((f) => (tab === ALL || f.docType === tab) &&
      (!nq || noAccent([f.name, f.contract.contractNo, f.contract.partner].join(" ")).includes(nq)));
  }, [docs, tab, q]);
  const count = (t: string) => (docs || []).filter((f) => f.docType === t).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tài liệu</h1>
        <p className="text-sm text-muted-foreground">Toàn bộ file đã tải lên của mọi hợp đồng</p>
      </div>
      <Card className="p-0 gap-0 overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" placeholder="Tìm tên file, số hợp đồng, đối tác..." />
          </div>
          <div className="overflow-x-auto">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value={ALL}>Tất cả ({docs?.length ?? 0})</TabsTrigger>
                {DOC_TYPES.map((t) => <TabsTrigger key={t} value={t}>{t} ({count(t)})</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tên file</TableHead><TableHead>Loại</TableHead><TableHead>Hợp đồng</TableHead>
              <TableHead>Người tải</TableHead><TableHead>Thời gian</TableHead><TableHead className="text-right">Thao tác</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {!docs && Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6" /></TableCell></TableRow>)}
              {docs && !list.length && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Không có tài liệu</TableCell></TableRow>}
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
        <div className="px-4 py-3 border-t text-sm text-muted-foreground">{list.length} tài liệu</div>
      </Card>
    </div>
  );
}
