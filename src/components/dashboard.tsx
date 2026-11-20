"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { COMPANY, CONTRACT_TYPES, computeStatus } from "@/lib/constants";
import { api, fmtDate, fmtDateTime, sumByCur, type ContractRow, type DocumentRow } from "@/lib/format";
import { AlertTriangle, ArrowRight, CheckCircle2, FileStack, FileText, Wallet } from "lucide-react";

const daysLeft = (d: string) => Math.ceil((new Date(d).setHours(23, 59, 59) - Date.now()) / 864e5);

export function Dashboard() {
  const [rows, setRows] = useState<ContractRow[] | null>(null);
  const [docs, setDocs] = useState<DocumentRow[] | null>(null);
  useEffect(() => {
    api<ContractRow[]>("/api/contracts").then(setRows).catch(() => setRows([]));
    api<DocumentRow[]>("/api/documents").then(setDocs).catch(() => setDocs([]));
  }, []);

  const d = useMemo(() => {
    const list = (rows || []).map((r) => ({ ...r, st: computeStatus(r.status, r.endDate) }));
    const live = list.filter((r) => r.st === "ACTIVE" || r.st === "SOON");
    return {
      total: list.length, live: live.length,
      soon: list.filter((r) => r.st === "SOON").sort((a, b) => a.endDate!.localeCompare(b.endDate!)),
      expired: list.filter((r) => r.st === "EXPIRED"),
      sell: sumByCur(live.filter((r) => r.direction.startsWith("Bán"))), buy: sumByCur(live.filter((r) => r.direction.startsWith("Mua"))),
      byType: CONTRACT_TYPES.map((t) => ({ t, n: list.filter((r) => r.type === t).length })).filter((x) => x.n),
    };
  }, [rows]);
  const maxType = Math.max(1, ...d.byType.map((x) => x.n));

  const stat = (label: string, value: React.ReactNode, icon: React.ReactNode, sub?: string, href?: string) => (
    <Card className="gap-2">
      <CardHeader>
        <CardDescription>{label}</CardDescription><CardAction className="text-muted-foreground">{icon}</CardAction>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">{rows ? value : <Skeleton className="h-8 w-20" />}</div>
        {sub && (href ? <Link href={href} className="text-xs text-muted-foreground hover:underline">{sub}</Link> : <div className="text-xs text-muted-foreground">{sub}</div>)}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">{COMPANY.name}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {stat("Hợp đồng đang chạy", d.live, <FileText className="size-4" />, `trên tổng ${d.total} hợp đồng`, "/contracts")}
        {stat("Sắp hết hạn (30 ngày)", <span className={d.soon.length ? "text-amber-600" : ""}>{d.soon.length}</span>, <AlertTriangle className="size-4" />,
          `${d.expired.length} hợp đồng đã hết hạn`, "/contracts?status=EXPIRED")}
        {stat("Giá trị bán ra đang chạy", <span className="text-xl">{d.sell}</span>, <Wallet className="size-4" />, "trước VAT, không quy đổi tiền tệ")}
        {stat("Giá trị mua vào đang chạy", <span className="text-xl">{d.buy}</span>, <Wallet className="size-4" />, "trước VAT, không quy đổi tiền tệ")}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Cần xử lý</CardTitle><CardDescription>Hợp đồng sắp hết hạn – cân nhắc gia hạn hoặc thanh lý</CardDescription>
            <CardAction><Button variant="outline" size="sm" asChild><Link href="/contracts?status=SOON">Xem tất cả <ArrowRight /></Link></Button></CardAction>
          </CardHeader>
          <CardContent>
            {!rows ? <Skeleton className="h-32" /> : !d.soon.length ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><CheckCircle2 className="size-4 text-green-600" /> Không có hợp đồng nào sắp hết hạn</div>
            ) : (
              <ul className="divide-y">
                {d.soon.map((r) => (
                  <li key={r.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/contracts/${r.id}`} className="font-medium hover:underline">{r.contractNo}</Link>
                      <div className="text-sm text-muted-foreground truncate">{r.partner} · {r.title}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{fmtDate(r.endDate)}</div>
                      <div className="text-xs text-amber-600 font-medium">còn {daysLeft(r.endDate!)} ngày</div>
                    </div>
                    <StatusBadge status={r.status} endDate={r.endDate} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Theo loại hợp đồng</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!rows ? <Skeleton className="h-32" /> : d.byType.map((x) => (
              <div key={x.t} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{x.t}</span><span className="tabular-nums text-muted-foreground">{x.n}</span></div>
                <div className="h-2 rounded-full bg-zinc-100"><div className="h-2 rounded-full bg-zinc-900" style={{ width: `${(x.n / maxType) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tài liệu mới tải lên</CardTitle><CardDescription>Hợp đồng, phụ lục, biên bản nghiệm thu gần đây</CardDescription>
          <CardAction><Button variant="outline" size="sm" asChild><Link href="/documents">Tất cả tài liệu <ArrowRight /></Link></Button></CardAction>
        </CardHeader>
        <CardContent>
          {!docs ? <Skeleton className="h-32" /> : (
            <ul className="divide-y">
              {docs.slice(0, 6).map((f) => (
                <li key={f.id} className="py-2.5 flex items-center gap-3 text-sm">
                  <FileStack className="size-4 text-muted-foreground shrink-0" />
                  <a href={`/api/files/${f.id}`} target="_blank" className="flex-1 min-w-0 truncate hover:underline">{f.name}</a>
                  <span className="text-xs bg-zinc-100 rounded px-2 py-0.5 hidden sm:inline">{f.docType}</span>
                  <Link href={`/contracts/${f.contract.id}`} className="text-muted-foreground hover:underline hidden md:inline">{f.contract.contractNo}</Link>
                  <span className="text-xs text-muted-foreground w-32 text-right hidden lg:inline">{fmtDateTime(f.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
