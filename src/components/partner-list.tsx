"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeStatus } from "@/lib/constants";
import { api, fmtDate, fmtCur, sumByCur, noAccent, type ContractRow } from "@/lib/format";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { useSearch } from "./page-header";

type Partner = { key: string; name: string; tax: string | null; rep: string | null; address: string | null; contracts: ContractRow[]; live: number; value: number; roles: Set<string> };

export function PartnerList() {
  const [rows, setRows] = useState<ContractRow[] | null>(null);
  const { q } = useSearch();
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { api<ContractRow[]>("/api/contracts").then(setRows).catch(() => setRows([])); }, []);

  const partners = useMemo(() => {
    const map = new Map<string, Partner>();
    for (const r of rows || []) {
      const key = r.partnerTax?.trim() || noAccent(r.partner.trim());
      const p = map.get(key) ?? { key, name: r.partner, tax: r.partnerTax, rep: r.partnerRep, address: r.partnerAddress, contracts: [], live: 0, value: 0, roles: new Set<string>() };
      p.contracts.push(r);
      if ((r.currency || "VND") === "VND") p.value += r.value || 0;
      p.roles.add(r.direction.startsWith("Bán") ? "Khách hàng" : r.direction.startsWith("Mua") ? "Nhà cung cấp" : "Đối tác");
      const st = computeStatus(r.status, r.endDate);
      if (st === "ACTIVE" || st === "SOON") p.live++;
      map.set(key, p);
    }
    const nq = noAccent(q.trim());
    return [...map.values()].filter((p) => !nq || noAccent([p.name, p.tax, p.rep].join(" ")).includes(nq))
      .sort((a, b) => b.value - a.value);
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <Card className="p-0 gap-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-8" /><TableHead>Đối tác</TableHead><TableHead>Vai trò</TableHead><TableHead>Người đại diện</TableHead>
              <TableHead className="text-right">Số HĐ</TableHead><TableHead className="text-right">Đang chạy</TableHead><TableHead className="text-right">Tổng giá trị</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {!rows && Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-6" /></TableCell></TableRow>)}
              {rows && !partners.length && <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Chưa có đối tác</TableCell></TableRow>}
              {partners.map((p) => (
                <PartnerRows key={p.key} p={p} open={open === p.key} toggle={() => setOpen(open === p.key ? null : p.key)} />
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t text-sm text-muted-foreground">{partners.length} đối tác</div>
      </Card>
    </div>
  );
}

function PartnerRows({ p, open, toggle }: { p: Partner; open: boolean; toggle: () => void }) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={toggle}>
        <TableCell>{open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</TableCell>
        <TableCell className="max-w-[320px]">
          <div className="font-medium truncate">{p.name}</div>
          <div className="text-xs text-muted-foreground truncate">{[p.tax && `MST ${p.tax}`, p.address].filter(Boolean).join(" · ")}</div>
        </TableCell>
        <TableCell>{[...p.roles].join(", ")}</TableCell>
        <TableCell>{p.rep}</TableCell>
        <TableCell className="text-right tabular-nums">{p.contracts.length}</TableCell>
        <TableCell className="text-right tabular-nums">{p.live}</TableCell>
        <TableCell className="text-right tabular-nums">{sumByCur(p.contracts)}</TableCell>
      </TableRow>
      {open && p.contracts.map((c) => (
        <TableRow key={c.id} className="bg-zinc-50/70 hover:bg-zinc-100/70">
          <TableCell />
          <TableCell colSpan={2}>
            <Link href={`/contracts/${c.id}`} className="font-medium hover:underline">{c.contractNo}</Link>
            <div className="text-xs text-muted-foreground truncate max-w-[360px]">{c.type} · {c.title}</div>
          </TableCell>
          <TableCell className="text-sm">{fmtDate(c.signDate)} → {fmtDate(c.endDate)}</TableCell>
          <TableCell colSpan={2} className="text-right"><StatusBadge status={c.status} endDate={c.endDate} /></TableCell>
          <TableCell className="text-right tabular-nums">{fmtCur(c.value, c.currency)}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
