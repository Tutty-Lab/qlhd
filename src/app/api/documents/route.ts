import { prisma } from "@/lib/db";
import { handle, requireUser } from "@/lib/auth";

// Tất cả file của mọi hợp đồng (trang Tài liệu)
export const GET = () => handle(async () => {
  await requireUser();
  const list = await prisma.contractFile.findMany({
    orderBy: { createdAt: "desc" },
    include: { contract: { select: { id: true, contractNo: true, partner: true, type: true } } },
  });
  return Response.json(list);
});
