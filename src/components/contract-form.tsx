"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { FileDrop, toFormData, type PendingFile } from "./file-drop";
import { CONTRACT_TYPES, DIRECTIONS, TYPE_FIELDS, type ExtraField } from "@/lib/constants";
import { api, CURRENCIES, fmtMoney, jsonInit, parseExtra, toInputDate, type ContractRow } from "@/lib/format";
import { Loader2 } from "lucide-react";

type Form = Record<string, string>;
const empty = (): Form => ({
  contractNo: "", title: "", type: CONTRACT_TYPES[0], direction: DIRECTIONS[0], partner: "", partnerTax: "",
  partnerRep: "", partnerAddress: "", signDate: "", startDate: "", endDate: "", value: "", currency: "VND", vat: "", owner: "", note: "", tags: "",
});
const fromRow = (c: ContractRow): Form => ({
  ...empty(),
  ...Object.fromEntries(Object.keys(empty()).map((k) => [k, c[k as keyof ContractRow] == null ? "" : String(c[k as keyof ContractRow])])),
  signDate: toInputDate(c.signDate), startDate: toInputDate(c.startDate), endDate: toInputDate(c.endDate),
});
const digits = (s: string) => s.replace(/\D/g, "");

export function ContractForm({ open, onOpenChange, contract, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; contract?: ContractRow | null; onSaved: (id: string) => void;
}) {
  const editing = !!contract;
  const [f, setF] = useState<Form>(empty);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) { setF(contract ? fromRow(contract) : empty()); setExtra(parseExtra(contract?.extra)); setFiles([]); }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const sel = (k: string, opts: string[]) => (
    <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
  const field = (k: string, label: string, props: React.ComponentProps<typeof Input> = {}, req = false) => (
    <div className="space-y-1.5"><Label htmlFor={k}>{label}{req && <span className="text-destructive"> *</span>}</Label>
      <Input id={k} value={f[k]} onChange={set(k)} {...props} /></div>
  );
  const extraField = (x: ExtraField) => {
    const v = extra[x.key] || "";
    const setV = (val: string) => setExtra({ ...extra, [x.key]: val });
    const id = "x-" + x.key;
    return (
      <div key={x.key} className={`space-y-1.5 ${x.kind === "textarea" ? "sm:col-span-2" : ""}`}>
        <Label htmlFor={id}>{x.label}</Label>
        {x.kind === "textarea" ? <Textarea id={id} rows={2} value={v} placeholder={x.placeholder} onChange={(e) => setV(e.target.value)} />
          : x.kind === "money" ? <Input id={id} inputMode="numeric" value={v ? fmtMoney(Number(v)) : ""} placeholder={x.placeholder} onChange={(e) => setV(digits(e.target.value))} />
          : <Input id={id} type={x.kind === "date" ? "date" : x.kind === "number" ? "number" : "text"} value={v} placeholder={x.placeholder} onChange={(e) => setV(e.target.value)} />}
      </div>
    );
  };
  const typeFields = TYPE_FIELDS[f.type] || [];

  async function save() {
    setSaving(true);
    try {
      const keep = new Set(typeFields.map((x) => x.key));
      const body = { ...f, value: digits(f.value), extra: Object.fromEntries(Object.entries(extra).filter(([k]) => keep.has(k))) };
      const c = editing
        ? await api<ContractRow>(`/api/contracts/${contract!.id}`, jsonInit("PATCH", body))
        : await api<ContractRow>("/api/contracts", { method: "POST", body: toFormData(files, body) });
      toast.success(editing ? "Đã lưu thay đổi" : "Đã thêm hợp đồng");
      onOpenChange(false); onSaved(c.id);
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Sửa hợp đồng" : "Thêm hợp đồng"}</SheetTitle>
          <SheetDescription>{editing ? contract!.contractNo : "Nhập thông tin và tải lên file hợp đồng đã ký"}</SheetDescription>
        </SheetHeader>
        <div className="px-4 space-y-5 pb-4">
          <section className="grid sm:grid-cols-2 gap-3">
            {field("contractNo", "Số hợp đồng", { placeholder: "VD: 015/2026/HĐDV-TTL" }, true)}
            <div className="space-y-1.5"><Label>Loại hợp đồng</Label>{sel("type", CONTRACT_TYPES)}</div>
            <div className="sm:col-span-2">{field("title", "Tên / nội dung hợp đồng", { placeholder: "VD: Dịch vụ quảng cáo Facebook Q1/2026" })}</div>
            <div className="space-y-1.5"><Label>Chiều hợp đồng</Label>{sel("direction", DIRECTIONS)}</div>
            {field("owner", "Người phụ trách")}
          </section>
          <Separator />
          <section className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">{field("partner", "Đối tác", { placeholder: "Tên công ty / cá nhân" }, true)}</div>
            {field("partnerTax", "Mã số thuế / CCCD")}
            {field("partnerRep", "Người đại diện")}
            <div className="sm:col-span-2">{field("partnerAddress", "Địa chỉ")}</div>
          </section>
          <Separator />
          <section className="grid sm:grid-cols-3 gap-3">
            {field("signDate", "Ngày ký", { type: "date" })}
            {field("startDate", "Ngày hiệu lực", { type: "date" })}
            {field("endDate", "Ngày hết hạn", { type: "date" })}
            <div className="sm:col-span-2 flex gap-2 items-end">
              <div className="flex-1">{field("value", `Giá trị trước VAT (${f.currency === "VND" ? "VNĐ" : f.currency})`, {
                inputMode: "numeric", value: f.value ? fmtMoney(Number(digits(f.value))) : "",
                onChange: (e) => setF({ ...f, value: digits(e.target.value) }),
              })}</div>
              <Select value={f.currency} onValueChange={(v) => setF({ ...f, currency: v })}>
                <SelectTrigger className="w-24" aria-label="Tiền tệ"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {field("vat", "VAT (%)", { type: "number", min: 0, max: 100, placeholder: "8 / 10" })}
          </section>
          {typeFields.length > 0 && (<>
            <Separator />
            <section className="space-y-3">
              <div className="text-sm font-semibold">Thông tin riêng · {f.type}</div>
              <div className="grid sm:grid-cols-2 gap-3">{typeFields.map(extraField)}</div>
            </section>
          </>)}
          <Separator />
          <section className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">{field("tags", "Tag (cách nhau dấu phẩy)", { placeholder: "marketing, thuê văn phòng" })}</div>
            <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="note">Ghi chú</Label><Textarea id="note" value={f.note} onChange={set("note")} rows={3} /></div>
          </section>
          {!editing && (<><Separator /><section className="space-y-2"><Label>File đính kèm</Label><FileDrop value={files} onChange={setFiles} /></section></>)}
        </div>
        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="animate-spin" />}{editing ? "Lưu" : "Thêm hợp đồng"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
