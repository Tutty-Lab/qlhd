"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, noAccent, type ContractRow } from "@/lib/format";
import { Loader2, Plus, Search } from "lucide-react";
import { NdaDialog } from "./nda-dialog";

// Ở trang Tài liệu: chọn hợp đồng → mở form tạo Thỏa thuận bảo mật
export function NdaCreateButton({ onCreated }: { onCreated: () => void }) {
  const [pick, setPick] = useState(false);
  const [rows, setRows] = useState<ContractRow[] | null>(null);
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<ContractRow | null>(null);

  function open() {
    setPick(true); setQ("");
    if (!rows) api<ContractRow[]>("/api/contracts").then(setRows).catch(() => setRows([]));
  }
  const list = useMemo(() => {
    const nq = noAccent(q.trim());
    return (rows || []).filter((r) => !nq || noAccent(`${r.contractNo} ${r.partner} ${r.title || ""}`).includes(nq));
  }, [rows, q]);

  return (
    <>
      <Button className="h-9" onClick={open}><Plus /> Tạo thỏa thuận bảo mật</Button>
      <Dialog open={pick} onOpenChange={setPick}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chọn hợp đồng</DialogTitle>
            <DialogDescription>Thỏa thuận bảo mật sẽ lấy thông tin đối tác từ hợp đồng này và được lưu vào hợp đồng.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" placeholder="Số hợp đồng, đối tác..." />
          </div>
          <div className="max-h-[50vh] overflow-y-auto -mx-2">
            {!rows && <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>}
            {rows && !list.length && <div className="py-8 text-center text-sm text-muted-foreground">Không có hợp đồng</div>}
            {list.map((r) => (
              <button key={r.id} onClick={() => { setChosen(r); setPick(false); }}
                className="w-full text-left px-2 py-2 rounded-md hover:bg-muted">
                <div className="font-medium text-sm">{r.contractNo}</div>
                <div className="text-xs text-muted-foreground truncate">{r.partner}{r.title ? ` · ${r.title}` : ""}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {chosen && <NdaDialog contract={chosen} open={!!chosen} onOpenChange={(v) => !v && setChosen(null)} onCreated={onCreated} />}
    </>
  );
}
