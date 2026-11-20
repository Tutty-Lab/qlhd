export const fmtMoney = (v?: number | null) => (v == null ? "" : new Intl.NumberFormat("vi-VN").format(v));
export const CURRENCIES = ["VND", "EUR", "USD"];
export const curUnit = (c?: string | null) => (!c || c === "VND" ? "đ" : c);
export const fmtCur = (v?: number | null, c?: string | null) => (v == null ? "" : `${fmtMoney(v)} ${curUnit(c)}`);
// Cộng giá trị theo từng loại tiền, không quy đổi: "48.400.000 đ · 3.850 EUR"
export const sumByCur = (rows: { value: number | null; currency?: string | null }[]) => {
  const m = new Map<string, number>();
  for (const r of rows) if (r.value != null) m.set(r.currency || "VND", (m.get(r.currency || "VND") || 0) + r.value);
  if (!m.size) return "0 đ";
  return [...m].sort(([a], [b]) => (a === "VND" ? -1 : b === "VND" ? 1 : a.localeCompare(b))).map(([c, v]) => fmtCur(v, c)).join(" · ");
};
export const fmtDate = (v?: string | Date | null) => (v ? new Date(v).toLocaleDateString("vi-VN", { timeZone: "UTC" }) : "");
export const fmtDateTime = (v?: string | Date | null) => (v ? new Date(v).toLocaleString("vi-VN") : "");
// Ngày được lưu ở 00:00 UTC (form gửi "YYYY-MM-DD") → đọc lại theo UTC để không lệch ngày
export const toInputDate = (v?: string | Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");
export const fmtSize = (b: number) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
export const noAccent = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401 && typeof window !== "undefined") { window.location.href = "/login"; throw new Error("Chưa đăng nhập"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
  return data as T;
}
export const jsonInit = (method: string, body: unknown): RequestInit => ({
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

export type ContractRow = {
  id: string; company: string; contractNo: string; title: string | null; type: string; direction: string;
  partner: string; partnerTax: string | null; partnerRep: string | null; partnerAddress: string | null;
  signDate: string | null; startDate: string | null; endDate: string | null; value: number | null; currency: string; vat: number | null;
  owner: string | null; note: string | null; tags: string | null; extra: string | null; status: string; createdBy: string; createdAt: string;
  _count?: { files: number };
};
export type ContractFile = { id: string; name: string; mime: string; size: number; docType: string; note: string | null; uploadedBy: string; createdAt: string };
export type HistoryItem = { id: string; action: string; note: string | null; by: string; at: string };
export type ContractDetail = ContractRow & { files: ContractFile[]; history: HistoryItem[] };
export type DocumentRow = ContractFile & { contract: { id: string; contractNo: string; partner: string; type: string } };
export const parseExtra = (s?: string | null): Record<string, string> => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };
