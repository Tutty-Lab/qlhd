import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
export const COOKIE = "qlhd_session";
export type SessionUser = { id: string; username: string; name: string; role: string };

export async function createSession(userId: string, days: number) {
  const token = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${days}d`).sign(key);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: days * 86400,
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIE !== "1",
  });
}
export async function verifyToken(token?: string) {
  if (!token) return null;
  try { return (await jwtVerify(token, key)).payload.sub ?? null; } catch { return null; }
}
export async function getUser(): Promise<SessionUser | null> {
  const id = await verifyToken((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? { id: u.id, username: u.username, name: u.name, role: u.role } : null;
}
export const can = {
  edit: (u: SessionUser) => u.role === "admin" || u.role === "editor",
  del: (u: SessionUser) => u.role === "admin",
};
export class HttpError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}
export async function requireUser(check?: (u: SessionUser) => boolean) {
  const u = await getUser();
  if (!u) throw new HttpError(401, "Chưa đăng nhập");
  if (check && !check(u)) throw new HttpError(403, "Tài khoản không có quyền này");
  return u;
}
export function handle(fn: () => Promise<Response>) {
  return fn().catch((e) => {
    if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
    console.error(e);
    return Response.json({ error: e?.message || "Lỗi máy chủ" }, { status: 500 });
  });
}
