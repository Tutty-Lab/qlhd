import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password, remember } = await req.json();
  const u = await prisma.user.findUnique({ where: { username: String(username || "").trim().toLowerCase() } });
  if (!u || !(await bcrypt.compare(String(password || ""), u.password)))
    return Response.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
  await createSession(u.id, remember ? 30 : 1);
  return Response.json({ ok: true });
}
