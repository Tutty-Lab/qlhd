import { prisma } from "@/lib/db";
import { can, handle, requireUser } from "@/lib/auth";
import { storeFile } from "@/lib/contract";

export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) => handle(async () => {
  const me = await requireUser(can.edit);
  const id = (await params).id;
  await prisma.contract.findUniqueOrThrow({ where: { id } });
  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (!files.length) return Response.json({ error: "Chưa chọn file" }, { status: 400 });
  const docTypes: string[] = JSON.parse(String(form.get("docTypes") || "[]"));
  const saved = [];
  for (const [i, f] of files.entries())
    saved.push(await prisma.contractFile.create({ data: { contractId: id, ...(await storeFile(id, f, docTypes[i], me.name)) } }));
  await prisma.history.create({
    data: { contractId: id, by: me.name, action: `Tải lên ${files.length} file`, note: [...new Set(saved.map((s) => s.docType))].join(", ") },
  });
  return Response.json(saved);
});
