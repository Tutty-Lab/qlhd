import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("qlhd_session")?.value;
  let ok = false;
  if (token) try { await jwtVerify(token, key); ok = true; } catch {}
  if (!ok) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!login|api|_next|favicon.ico|.*\\..*).*)"] };
