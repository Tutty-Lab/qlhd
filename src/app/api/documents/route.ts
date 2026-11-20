import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { handle, requireUser } from "@/lib/auth";

// Danh sách file (trang Tài liệu) – lọc + phân trang ở server.
// ?type=<loại> &q=<từ khoá> &page=1 &limit=50
export const GET = (req: Request) => handle(async () => {
  await requireUser();
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") || "";
  const q = (sp.get("q") || "").trim();
  const limit = Math.min(200, Math.max(1, Number(sp.get("limit")) || 50));
  const page = Math.max(1, Number(sp.get("page")) || 1);

  // Tìm không dấu (gõ "hop dong" ra "hợp đồng") bằng extension unaccent của Postgres
  let search: Prisma.ContractFileWhereInput = {};
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT f.id FROM "ContractFile" f JOIN "Contract" c ON c.id = f."contractId"
      WHERE unaccent(lower(f.name || ' ' || c."contractNo" || ' ' || c.partner)) LIKE unaccent(lower(${like}))`;
    search = { id: { in: ids.map((r) => r.id) } };
  }
  const where: Prisma.ContractFileWhereInput = { ...search, ...(type ? { docType: type } : {}) };

  const [items, total, groups] = await Promise.all([
    prisma.contractFile.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      include: { contract: { select: { id: true, contractNo: true, partner: true, type: true } } },
    }),
    prisma.contractFile.count({ where }),
    prisma.contractFile.groupBy({ by: ["docType"], where: search, _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(groups.map((g) => [g.docType, g._count._all]));
  return Response.json({ items, total, page, limit, counts, all: groups.reduce((s, g) => s + g._count._all, 0) });
});
