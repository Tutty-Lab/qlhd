// Tạo tài khoản ban đầu (chỉ tạo nếu chưa có, không ghi đè mật khẩu đã đổi).
// Mật khẩu lấy từ SEED_PASSWORD, nếu không có thì sinh ngẫu nhiên và in ra màn hình MỘT LẦN.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: "admin", name: "Quản trị", role: "admin" },
    { username: "nhanvien", name: "Nhân viên", role: "editor" },
    { username: "xem", name: "Người xem", role: "viewer" },
  ];
  for (const u of users) {
    if (await prisma.user.findUnique({ where: { username: u.username } })) { console.log(`- ${u.username}: đã có, bỏ qua`); continue; }
    const pass = process.env.SEED_PASSWORD || crypto.randomBytes(9).toString("base64url");
    await prisma.user.create({ data: { ...u, password: await bcrypt.hash(pass, 10) } });
    console.log(`+ ${u.username} (${u.role}) – mật khẩu: ${pass}`);
  }
  console.log("Lưu lại mật khẩu ở trên và đổi sau khi đăng nhập (menu tài khoản cuối sidebar).");
}
main().finally(() => prisma.$disconnect());
