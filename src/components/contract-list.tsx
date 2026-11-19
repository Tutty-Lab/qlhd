"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { ContractForm } from "./contract-form";
import { CONTRACT_TYPES, DIRECTIONS, STATUS_LABEL, computeStatus, type StatusKey } from "@/lib/constants";
import { api, fmtDate, fmtMoney, noAccent, type ContractRow } from "@/lib/format";
import { ArrowDown, ArrowUp, Download, Paperclip, Plus, Search } from "lucide-react";

const ALL = "__all";
type SortKey = "contractNo" | "partner" | "signDate" | "endDate" | "value";

export function ContractList({ canEdit }: { canEdit: boolean; canDelete: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<ContractRow[] | null>(null);
  const [q, setQ] = useState("");
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
      { label: "Sắp hết hạn (30 ngày)", value: c("SOON"), s: "SOON", warn: true },
      { label: "Hết hạn", value: c("EXPIRED"), s: "EXPIRED" },
      { label: "Đã thanh lý", value: c("DONE"), s: "DONE" },
    ];
  }, [withStatus]);
  const total = filtered.reduce((s, r) => s + (r.value || 0), 0);

  function exportXlsx() {
    const data = filtered.map((r) => ({
      "Số HĐ": r.contractNo, "Nội dung": r.title || "", "Loại": r.type, "Chiều": r.direction,
      "Đối tác": r.partner, "MST": r.partnerTax || "", "Ngày ký": fmtDate(r.signDate), "Hiệu lực": fmtDate(r.startDate),
      "Hết hạn": fmtDate(r.endDate), "Giá trị (trước VAT)": r.value ?? "", "VAT %": r.vat ?? "", "Phụ trách": r.owner || "",
      "Trạng thái": STATUS_LABEL[r.st], "Số file": r._count?.files ?? 0, "Ghi chú": r.note || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Hợp đồng");
    XLSX.writeFile(wb, `hop-dong-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
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
      <SelectTrigger size="sm" className="bg-white"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value={ALL}>{all}</SelectItem>{opts.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <div className="p-4 space-y-3 border-b">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" placeholder="Tìm số HĐ, đối tác, MST, nội dung, tag..." />
            </div>
            <Button variant="outline" className="h-9" onClick={exportXlsx} disabled={!filtered.length}><Download /> Xuất Excel</Button>
            {canEdit && <Button className="h-9" onClick={() => setFormOpen(true)}><Plus /> Thêm hợp đồng</Button>}
          </div>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            {filterSel(type, setType, "Tất cả loại", CONTRACT_TYPES.map((t) => [t, t]))}
            {filterSel(direction, setDirection, "Tất cả chiều", DIRECTIONS.map((t) => [t, t]))}
            {filterSel(status, setStatus, "Tất cả trạng thái", Object.entries(STATUS_LABEL))}
            <div className="flex items-center border rounded-md bg-white h-7 px-1">
              <span className="px-2 text-muted-foreground">Ngày ký</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent outline-none px-1" />
              <span className="text-zinc-400 px-1">–</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent outline-none px-1" />
            </div>
            <Button variant="link" size="sm" onClick={reset} className="text-muted-foreground">Xoá lọc</Button>
          </div>
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
                  <TableCell className="text-right tabular-nums">{fmtMoney(r.value)}</TableCell>
                  <TableCell className="text-center"><span className="inline-flex items-center gap-1 text-muted-foreground"><Paperclip className="size-3.5" />{r._count?.files ?? 0}</span></TableCell>
                  <TableCell><StatusBadge status={r.status} endDate={r.endDate} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t text-sm flex justify-between text-muted-foreground">
          <span>{filtered.length} hợp đồng</span><span>Tổng giá trị: <b className="text-foreground">{fmtMoney(total)} đ</b></span>
        </div>
      </Card>

      <ContractForm open={formOpen} onOpenChange={setFormOpen} onSaved={(id) => router.push(`/contracts/${id}`)} />
    </div>
  );
}
