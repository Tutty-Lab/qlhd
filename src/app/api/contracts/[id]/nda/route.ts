import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { can, handle, requireUser } from "@/lib/auth";
import { saveObject } from "@/lib/storage";
import { buildNda } from "@/lib/nda";

const MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const schema = z.object({
  number: z.string().trim().min(1, "Thiếu số thỏa thuận").max(100),
  purpose: z.string().trim().min(1, "Thiếu mục đích").max(1000),
  years: z.coerce.number().int().min(1).max(20).default(2),
  penalty: z.union([z.number(), z.string()]).optional().nullable()
    .transform((v) => (v === "" || v == null ? null : Number(String(v).replace(/\D/g, "")) || null)),
});

// Tạo file Thỏa thuận bảo mật (.docx) từ thông tin hợp đồng, lưu vào hợp đồng với loại "Thỏa thuận bảo mật"
export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) => handle(async () => {
  const me = await requireUser(can.edit);
  const { id } = await params;
  const c = await prisma.contract.findUnique({ where: { id } });
  if (!c) return Response.json({ error: "Không tìm thấy hợp đồng" }, { status: 404 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  const d = parsed.data;

  const buf = await buildNda({ ...d, contractNo: c.contractNo, partner: c.partner, partnerTax: c.partnerTax, partnerRep: c.partnerRep, partnerAddress: c.partnerAddress });
  const safe = c.partner.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[Đđ]/g, "D").replace(/[^\w]+/g, "_").slice(0, 40);
  const name = `Thỏa thuận bảo mật ${c.partner}.docx`;
  const stored = await saveObject(`${id.slice(-8)}_${crypto.randomBytes(4).toString("hex")}_NDA_${safe}.docx`, buf, MIME);
  const f = await prisma.contractFile.create({ data: { contractId: id, name, stored, mime: MIME, size: buf.length, docType: "Thỏa thuận bảo mật", uploadedBy: me.name } });
  await prisma.history.create({ data: { contractId: id, action: "Tạo thỏa thuận bảo mật", note: d.number, by: me.name } });
  return Response.json(f);
});
