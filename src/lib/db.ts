import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Neon: kết nối qua WebSocket (cổng 443) thay vì TCP 5432 → chạy được cả khi mạng chặn cổng Postgres.
function create() {
  // SG_DATABASE_URL: Neon Singapore (production), gần người dùng VN hơn us-east
  const url = process.env.SG_DATABASE_URL || process.env.DATABASE_URL || "";
  if (url.includes("neon.tech")) {
    neonConfig.webSocketConstructor = ws;
    return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  }
  return new PrismaClient();
}

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? create();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
