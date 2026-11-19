import { z } from "zod";
import crypto from "crypto";
import { saveObject } from "./storage";
import { COMPANY, CONTRACT_TYPES, DIRECTIONS, DOC_TYPES } from "./constants";

const optDate = z.string().optional().nullable().transform((v) => (v ? new Date(v) : null));
const optStr = z.string().trim().max(2000).optional().nullable().transform((v) => v || null);
const optNum = z.union([z.number(), z.string()]).optional().nullable()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v == null || (Number.isFinite(v) && v >= 0), "Số không hợp lệ");

export const contractSchema = z.object({
  company: z.unknown().optional().transform(() => COMPANY.code),
  extra: z.record(z.string(), z.string().max(2000)).optional().nullable()
    .transform((v) => {
      const clean = Object.fromEntries(Object.entries(v || {}).map(([k, x]) => [k, x.trim()]).filter(([, x]) => x));
      return Object.keys(clean).length ? JSON.stringify(clean) : null;
    }),
  contractNo: z.string().trim().min(1, "Thiếu số hợp đồng").max(100),
  title: optStr,
  type: z.enum(CONTRACT_TYPES as [string, ...string[]], { message: "Chọn loại hợp đồng" }),
  direction: z.enum(DIRECTIONS as [string, ...string[]], { message: "Chọn chiều hợp đồng" }),
  partner: z.string().trim().min(1, "Thiếu tên đối tác").max(300),
  partnerTax: optStr, partnerRep: optStr, partnerAddress: optStr,
  signDate: optDate, startDate: optDate, endDate: optDate,
  value: optNum, vat: optNum, owner: optStr, note: optStr, tags: optStr,
}).refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  { message: "Ngày hết hạn phải sau ngày hiệu lực", path: ["endDate"] });

// Vercel giới hạn body request ~4.5MB cho serverless function
export const MAX_FILE = (process.env.VERCEL ? 4 : 50) * 1024 * 1024;

export async function storeFile(contractId: string, file: File, docType: string, by: string) {
  if (file.size > MAX_FILE) throw new Error(`File "${file.name}" vượt quá ${MAX_FILE / 1048576}MB`);
  const safe = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^\w.\-]+/g, "_").slice(-80);
  const name = `${contractId.slice(-8)}_${crypto.randomBytes(5).toString("hex")}_${safe}`;
  const stored = await saveObject(name, Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream");
  return {
    name: file.name, stored, mime: file.type || "application/octet-stream", size: file.size,
    docType: DOC_TYPES.includes(docType) ? docType : DOC_TYPES[0], uploadedBy: by,
  };
}
export const firstError = (e: z.ZodError) => e.issues.map((i) => i.message).join("; ");
