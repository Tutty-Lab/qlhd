"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, fmtMoney, jsonInit, type ContractDetail, type ContractFile } from "@/lib/format";
import { Loader2 } from "lucide-react";

// Tạo file Thỏa thuận bảo mật (.docx) từ thông tin hợp đồng
export function NdaDialog({ contract: c, open, onOpenChange, onCreated }: {
  contract: ContractDetail; open: boolean; onOpenChange: (v: boolean) => void; onCreated: (f: ContractFile) => void;
}) {
  const [f, setF] = useState({ number: "", purpose: "", years: "2", penalty: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setF({ number: `${c.contractNo}/TTBM`, purpose: c.title || `Thực hiện Hợp đồng số ${c.contractNo}`, years: "2", penalty: "" });
  }, [open, c]);

  async function create() {
    setBusy(true);
    try {
      const file = await api<ContractFile>(`/api/contracts/${c.id}/nda`, jsonInit("POST", { ...f, years: Number(f.years) }));
      toast.success("Đã tạo thỏa thuận bảo mật");
      onCreated(file);
      onOpenChange(false);
      window.location.href = `/api/files/${file.id}?download=1`;
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo thỏa thuận bảo mật</DialogTitle>
          <DialogDescription>
            Sinh file Word từ thông tin hợp đồng {c.contractNo} và đối tác {c.partner}. File được lưu vào hợp đồng (loại &ldquo;Thỏa thuận bảo mật&rdquo;) và tải về để in, ký.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label htmlFor="nda-no">Số thỏa thuận</Label>
            <Input id="nda-no" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="nda-purpose">Mục đích trao đổi thông tin</Label>
            <Textarea id="nda-purpose" rows={2} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="nda-years">Bảo mật sau khi HĐ kết thúc (năm)</Label>
              <Input id="nda-years" type="number" min={1} max={20} value={f.years} onChange={(e) => setF({ ...f, years: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="nda-penalty">Phạt mỗi lần vi phạm (VNĐ)</Label>
              <Input id="nda-penalty" inputMode="numeric" placeholder="Bỏ trống = chỉ bồi thường"
                value={f.penalty ? fmtMoney(Number(f.penalty)) : ""} onChange={(e) => setF({ ...f, penalty: e.target.value.replace(/\D/g, "") })} /></div>
          </div>
          {(!c.partnerTax || !c.partnerAddress || !c.partnerRep) && (
            <p className="text-xs text-amber-600">Hợp đồng còn thiếu MST/CCCD, địa chỉ hoặc người đại diện của đối tác – các ô đó sẽ để chấm (....) trong file.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={create} disabled={busy || !f.number.trim() || !f.purpose.trim()}>{busy && <Loader2 className="animate-spin" />}Tạo và tải về</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
