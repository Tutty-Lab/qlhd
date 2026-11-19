import { prisma } from "@/lib/db";
import { can, handle, requireUser } from "@/lib/auth";
import { contractSchema, firstError } from "@/lib/contract";
import { deleteObject } from "@/lib/storage";
import { STATUS_LABEL, type StatusKey } from "@/lib/constants";

type P = { params: Promise<{ id: string }> };

export const GET = (_: Request, { params }: P) => handle(async () => {
  await requireUser();
  const c = await prisma.contract.findUnique({
    where: { id: (await params).id },
    include: { files: { orderBy: { createdAt: "asc" } }, history: { orderBy: { at: "desc" } } },
  });
  return c ? Response.json(c) : Response.json({ error: "Không tìm thấy" }, { status: 404 });
});

export const PATCH = (req: Request, { params }: P) => handle(async () => {
  const me = await requireUser(can.edit);
  const id = (await params).id;
  const body = await req.json();
  const old = await prisma.contract.findUniqueOrThrow({ where: { id } });
  if (body.status) {
    if (!["ACTIVE", "DONE", "CANCEL"].includes(body.status))
      return Response.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    const c = await prisma.contract.update({
      where: { id }, data: {
        status: body.status,
        history: { create: { action: "Đổi trạng thái: " + STATUS_LABEL[body.status as StatusKey], note: body.note || null, by: me.name } },
      },
    });
    return Response.json(c);
  }
  const parsed = contractSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  const d = parsed.data;
  const dup = await prisma.contract.findUnique({ where: { company_contractNo: { company: d.company, contractNo: d.contractNo } } });
  if (dup && dup.id !== id) return Response.json({ error: "Số hợp đồng đã tồn tại ở công ty này" }, { status: 400 });
  const norm = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ""));
  const changed = (Object.keys(d) as (keyof typeof d)[]).filter((k) => norm(d[k]) !== norm(old[k]));
  const c = await prisma.contract.update({
    where: { id }, data: {
      ...d,
      ...(changed.length ? { history: { create: { action: "Sửa thông tin", note: changed.join(", "), by: me.name } } } : {}),
    },
  });
  return Response.json(c);
});

export const DELETE = (_: Request, { params }: P) => handle(async () => {
  await requireUser(can.del);
  const id = (await params).id;
  const files = await prisma.contractFile.findMany({ where: { contractId: id } });
  await prisma.contract.delete({ where: { id } });
  await Promise.all(files.map((f) => deleteObject(f.stored)));
  return Response.json({ ok: true });
});
