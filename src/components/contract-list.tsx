"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearch } from "./page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { ContractForm } from "./contract-form";
import { CONTRACT_TYPES, DIRECTIONS, STATUS_LABEL, computeStatus, type StatusKey } from "@/lib/constants";
import { api, fmtDate, fmtCur, sumByCur, noAccent, type ContractRow } from "@/lib/format";
import { ArrowDown, ArrowUp, Download, Paperclip, Plus, Filter } from "lucide-react";

const ALL = "__all";
type SortKey = "contractNo" | "partner" | "signDate" | "endDate" | "value";

export function ContractList({ canEdit }: { canEdit: boolean; canDelete: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<ContractRow[] | null>(null);
  const { q, setQ } = useSearch();
  const [type, setType] = useState(ALL);
  const [direction, setDirection] = useState(ALL);
  const [status, setStatus] = useState(params.get("status") || ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<{ k: SortKey; asc: boolean }>({ k: "signDate", asc: false });
  const [formOpen, setFormOpen] = useState(params.get("new") === "1");

  useEffect(() => { api<ContractRow[]>("/api/contracts").then(setRows).catch(() => setRows([])); }, []);

  const withStatus = useMemo(() => (rows || []).map((r) => ({ ...r, st: computeStatus(r.status, r.endDate) })), [rows]);
  const filtered = useMemo(() => {
    const nq = noAccent(q.trim());
    const list = withStatus.filter((r) =>
      (type === ALL || r.type === type) &&
      (direction === ALL || r.direction === direction) && (status === ALL || r.st === status) &&
      (!from || (r.signDate && r.signDate.slice(0, 10) >= from)) && (!to || (r.signDate && r.signDate.slice(0, 10) <= to)) &&
      (!nq || noAccent([r.contractNo, r.title, r.partner, r.partnerTax, r.owner, r.tags, r.note].join(" ")).includes(nq)));
    const { k, asc } = sort;
    return list.sort((a, b) => {
      const va = a[k] ?? "", vb = b[k] ?? "";
      const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "vi");
      return asc ? c : -c;
    });
  }, [withStatus, q, type, direction, status, from, to, sort]);

  const stats = useMemo(() => {
    const c = (s: StatusKey) => withStatus.filter((r) => r.st === s).length;
    return [
      { label: "Tổng hợp đồng", value: withStatus.length, s: ALL },
      { label: "Đang hiệu lực", value: c("ACTIVE"), s: "ACTIVE" },
      { label: "Sắp hết hạn", value: c("SOON"), s: "SOON", warn: true },
    ];
  }, [withStatus]);
  const total = sumByCur(filtered);

  function exportXlsx() {
    const data = filtered.map((r) => ({
      "Số HĐ": r.contractNo, "Nội dung": r.title || "", "Loại": r.type, "Chiều": r.direction,
      "Đối tác": r.partner, "MST": r.partnerTax || "", "Ngày ký": fmtDate(r.signDate), "Hiệu lực": fmtDate(r.startDate),
      "Hết hạn": fmtDate(r.endDate), "Giá trị (trước VAT)": r.value ?? "", "Tiền tệ": r.currency || "VND", "VAT %": r.vat ?? "", "Phụ trách": r.owner || "",
      "Trạng thái": STATUS_LABEL[r.st], "Số file": r._count?.files ?? 0, "Ghi chú": r.note || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Hợp đồng");
    XLSX.writeFile(wb, `hop-dong-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  const activeFilters = [type, direction, status].filter((v) => v !== ALL).length + (from || to ? 1 : 0);
  const reset = () => { setQ(""); setType(ALL); setDirection(ALL); setStatus(ALL); setFrom(""); setTo(""); };
  const sortHead = (k: SortKey, label: string, right = false) => (
    <TableHead className={right ? "text-right" : ""}>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort({ k, asc: sort.k === k ? !sort.asc : true })}>
        {label}{sort.k === k && (sort.asc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </TableHead>
  );
  const filterSel = (v: string, set: (v: string) => void, all: string, opts: [string, string][]) => (
    <Select value={v} onValueChange={set}>
      <SelectTrigger size="sm" className="bg-white w-full"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value={ALL}>{all}</SelectItem>{opts.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <button key={s.label} onClick={() => setStatus(s.s)} className="text-left">
            <Card className={`p-4 gap-1 transition-shadow hover:shadow-md ${status === s.s ? "ring-2 ring-zinc-900" : ""}`}>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className={`text-2xl font-semibold ${s.warn && s.value ? "text-amber-600" : ""}`}>{rows ? s.value : "–"}</div>
            </Card>
          </button>
        ))}
      </div>

      <Card className="p-0 gap-0 overflow-hidden">
        <div className="p-3 border-b flex flex-wrap gap-2 items-center">
          <div className="flex-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9"><Filter /> Bộ lọc{activeFilters > 0 && <span className="ml-1 rounded-full bg-zinc-900 text-white text-xs px-1.5">{activeFilters}</span>}</Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Loại hợp đồng</Label>{filterSel(type, setType, "Tất cả loại", CONTRACT_TYPES.map((t) => [t, t]))}</div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Chiều</Label>{filterSel(direction, setDirection, "Tất cả chiều", DIRECTIONS.map((t) => [t, t]))}</div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Trạng thái</Label>{filterSel(status, setStatus, "Tất cả trạng thái", Object.entries(STATUS_LABEL))}</div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Ngày ký</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" aria-label="Từ ngày" />
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" aria-label="Đến ngày" />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={reset} disabled={!activeFilters && !q}>Xoá lọc</Button>
            </PopoverContent>
          </Popover>
          <Button variant="outline" className="h-9" onClick={exportXlsx} disabled={!filtered.length}><Download /> Xuất Excel</Button>
          {canEdit && <Button className="h-9" onClick={() => setFormOpen(true)}><Plus /> Thêm hợp đồng</Button>}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {sortHead("contractNo", "Số hợp đồng")}
                {sortHead("partner", "Đối tác")}
                <TableHead>Loại</TableHead>
                {sortHead("signDate", "Ngày ký")}
                {sortHead("endDate", "Hết hạn")}
                {sortHead("value", "Giá trị", true)}
                <TableHead className="text-center">File</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!rows && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-6" /></TableCell></TableRow>
              ))}
              {rows && !filtered.length && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {rows.length ? "Không có hợp đồng khớp bộ lọc" : "Chưa có hợp đồng nào. Bấm \"Thêm hợp đồng\" để tải lên."}
                </TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => router.push(`/contracts/${r.id}`)}>
                  <TableCell>
                    <Link href={`/contracts/${r.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{r.contractNo}</Link>
                    {r.title && <div className="text-xs text-muted-foreground max-w-[280px] truncate">{r.title}</div>}
                  </TableCell>
                  <TableCell className="max-w-[260px]"><div className="truncate">{r.partner}</div>
                    {r.partnerTax && <div className="text-xs text-muted-foreground">MST {r.partnerTax}</div>}</TableCell>
                  <TableCell><div>{r.type}</div><div className="text-xs text-muted-foreground">{r.direction}</div></TableCell>
                  <TableCell>{fmtDate(r.signDate)}</TableCell>
                  <TableCell>{fmtDate(r.endDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtCur(r.value, r.currency)}</TableCell>
                  <TableCell className="text-center"><span className="inline-flex items-center gap-1 text-muted-foreground"><Paperclip className="size-3.5" />{r._count?.files ?? 0}</span></TableCell>
                  <TableCell><StatusBadge status={r.status} endDate={r.endDate} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t text-sm flex justify-between text-muted-foreground">
          <span>{filtered.length} hợp đồng</span><span>Tổng giá trị: <b className="text-foreground">{total}</b></span>
        </div>
      </Card>

      <ContractForm open={formOpen} onOpenChange={setFormOpen} onSaved={(id) => router.push(`/contracts/${id}`)} />
    </div>
  );
}
