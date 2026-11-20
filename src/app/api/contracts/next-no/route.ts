import { prisma } from "@/lib/db";
import { handle, requireUser } from "@/lib/auth";
import { parseContractSeq } from "@/lib/constants";

// Số thứ tự tiếp theo trong năm (dãy chung cho mọi loại hợp đồng)
export const GET = (req: Request) => handle(async () => {
  await requireUser();
  const year = Number(new URL(req.url).searchParams.get("year")) || new Date().getFullYear();
  const rows = await prisma.contract.findMany({ where: { contractNo: { contains: `/${year}/` } }, select: { contractNo: true } });
  const used = rows.map((r) => parseContractSeq(r.contractNo)).filter((x) => x && x.year === year).map((x) => x!.seq);
  return Response.json({ year, next: (used.length ? Math.max(...used) : 0) + 1, used: used.sort((a, b) => a - b) });
});
