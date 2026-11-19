// Khởi tạo database Neon qua HTTPS (cổng 443) – dùng khi mạng chặn cổng Postgres 5432.
// 1) Tạo bảng từ prisma/sql/init.sql (bỏ qua nếu đã có)
// 2) Tạo tài khoản admin / nhanvien / xem (bỏ qua tài khoản đã có), mật khẩu từ SEED_PASSWORD hoặc ngẫu nhiên.
// Chạy: node --env-file=.env.local scripts/neon-setup.mjs
// Sinh lại SQL khi đổi schema: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/sql/init.sql
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Thiếu DATABASE_URL");
const sql = neon(url);

const [{ exists }] = await sql.query(`SELECT to_regclass('public."User"') IS NOT NULL AS exists`);
if (!exists) {
  const statements = fs.readFileSync(new URL("../prisma/sql/init.sql", import.meta.url), "utf8")
    .split(/;\s*$/m).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
  for (const s of statements) await sql.query(s);
  console.log(`Đã tạo bảng (${statements.length} câu lệnh).`);
} else console.log("Bảng đã có, bỏ qua bước tạo bảng.");

const users = [
  { username: "admin", name: "Quản trị", role: "admin" },
  { username: "nhanvien", name: "Nhân viên", role: "editor" },
  { username: "xem", name: "Người xem", role: "viewer" },
];
for (const u of users) {
  const found = await sql.query(`SELECT 1 FROM "User" WHERE username = $1`, [u.username]);
  if (found.length) { console.log(`- ${u.username}: đã có, bỏ qua`); continue; }
  const pass = process.env.SEED_PASSWORD || crypto.randomBytes(9).toString("base64url");
  await sql.query(`INSERT INTO "User" (id, username, name, role, password) VALUES ($1, $2, $3, $4, $5)`,
    ["u_" + crypto.randomBytes(10).toString("hex"), u.username, u.name, u.role, await bcrypt.hash(pass, 10)]);
  console.log(`+ ${u.username} (${u.role}) – mật khẩu: ${pass}`);
}
