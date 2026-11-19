// Tạo .env.development.local để `npm run dev` dùng database Neon RIÊNG cho dev (không đụng production).
// Cần chạy trước: npx vercel env pull .env.local   (lấy DEV_DATABASE_URL của database qlhd-dev-db)
// Chạy: node scripts/dev-env.mjs
// Next.js ưu tiên .env.development.local hơn .env.local khi chạy dev.
import fs from "fs";
import crypto from "crypto";

const parse = (f) => (fs.existsSync(f) ? Object.fromEntries(fs.readFileSync(f, "utf8").split(/\r?\n/)
  .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^"|"$/g, "")])) : {});

const env = parse(".env.local");
if (!env.DEV_DATABASE_URL) throw new Error("Không thấy DEV_DATABASE_URL trong .env.local – chạy `npx vercel env pull .env.local` trước.");
const prev = parse(".env.development.local");

const out = {
  DATABASE_URL: env.DEV_DATABASE_URL,
  DATABASE_URL_UNPOOLED: env.DEV_DATABASE_URL_UNPOOLED || env.DEV_DATABASE_URL,
  AUTH_SECRET: prev.AUTH_SECRET || crypto.randomBytes(32).toString("hex"),
  BLOB_READ_WRITE_TOKEN: "",          // để trống → file lưu ở ./data/uploads, không lên Blob production
  BLOB_ACCESS: "",
  UPLOAD_DIR: "./data/uploads",
};
fs.writeFileSync(".env.development.local",
  "# Sinh bởi scripts/dev-env.mjs – database Neon riêng cho dev\n" +
  Object.entries(out).map(([k, v]) => `${k}="${v}"`).join("\n") + "\n");
console.log("Đã ghi .env.development.local (database dev:", new URL(out.DATABASE_URL).host + ")");
