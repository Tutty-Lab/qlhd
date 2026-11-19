import { prisma } from "@/lib/db";
import { can, handle, requireUser } from "@/lib/auth";
import { contractSchema, firstError, storeFile } from "@/lib/contract";

export const GET = () => handle(async () => {
  await requireUser();
  const list = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" }, include: { _count: { select: { files: true } } },
  });
  return Response.json(list);
});

// multipart: "data" = JSON thông tin, "files" + "docTypes" (JSON mảng cùng thứ tự)
export const POST = (req: Request) => handle(async () => {
  const me = await requireUser(can.edit);
  const form = await req.formData();
  const parsed = contractSchema.safeParse(JSON.parse(String(form.get("data") || "{}")));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  const d = parsed.data;
  if (await prisma.contract.findUnique({ where: { company_contractNo: { company: d.company, contractNo: d.contractNo } } }))
    return Response.json({ error: "Số hợp đồng đã tồn tại ở công ty này" }, { status: 400 });
  const c = await prisma.contract.create({
    data: { ...d, createdBy: me.name, history: { create: { action: "Tạo hợp đồng", by: me.name } } },
  });
  const files = form.getAll("files") as File[];
  const docTypes: string[] = JSON.parse(String(form.get("docTypes") || "[]"));
  for (const [i, f] of files.entries())
    await prisma.contractFile.create({ data: { contractId: c.id, ...(await storeFile(c.id, f, docTypes[i], me.name)) } });
  if (files.length)
    await prisma.history.create({ data: { contractId: c.id, action: `Tải lên ${files.length} file`, by: me.name } });
  return Response.json(c);
});
