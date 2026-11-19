import { prisma } from "@/lib/db";
import { can, handle, requireUser } from "@/lib/auth";
import { deleteObject } from "@/lib/storage";
import { DOC_TYPES } from "@/lib/constants";

type P = { params: Promise<{ id: string; fileId: string }> };

export const PATCH = (req: Request, { params }: P) => handle(async () => {
  await requireUser(can.edit);
  const { id, fileId } = await params;
  const b = await req.json();
  const f = await prisma.contractFile.update({
    where: { id: fileId, contractId: id }, data: {
      ...(DOC_TYPES.includes(b.docType) ? { docType: b.docType } : {}),
      ...(typeof b.note === "string" ? { note: b.note.slice(0, 300) } : {}),
    },
  });
  return Response.json(f);
});

export const DELETE = (_: Request, { params }: P) => handle(async () => {
  const me = await requireUser(can.del);
  const { id, fileId } = await params;
  const f = await prisma.contractFile.delete({ where: { id: fileId, contractId: id } });
  await deleteObject(f.stored);
  await prisma.history.create({ data: { contractId: id, action: "Xoá file", note: f.name, by: me.name } });
  return Response.json({ ok: true });
});
