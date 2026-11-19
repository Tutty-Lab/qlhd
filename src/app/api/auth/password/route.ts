import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handle, requireUser } from "@/lib/auth";

export const POST = (req: Request) => handle(async () => {
  const me = await requireUser();
  const { oldPassword, newPassword } = await req.json();
  const u = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(String(oldPassword || ""), u.password)))
    return Response.json({ error: "Mật khẩu cũ không đúng" }, { status: 400 });
  if (String(newPassword || "").length < 6)
    return Response.json({ error: "Mật khẩu mới tối thiểu 6 ký tự" }, { status: 400 });
  await prisma.user.update({ where: { id: me.id }, data: { password: await bcrypt.hash(newPassword, 10) } });
  return Response.json({ ok: true });
});
