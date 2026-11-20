# QLHD – Quản lý hợp đồng

Next.js 15 (App Router) · shadcn/ui · Tailwind v4 · Prisma (SQLite) · JWT cookie (jose).

## Cài đặt lần đầu
```bash
npm install
npm run setup        # tạo database + tài khoản mặc định
npm run dev -- -p 3100
```
Mở http://localhost:3100

Dữ liệu mẫu (8 hợp đồng + file PDF hợp đồng / phụ lục / BB nghiệm thu / thanh lý / hoá đơn, dùng font Arial của Windows):
```bash
npx tsx --env-file=.env prisma/seed-samples.ts            # thêm mẫu
npx tsx --env-file=.env prisma/seed-samples.ts --reset    # xoá mẫu cũ, tạo lại
```
Xoá dữ liệu mẫu: lọc người tạo "Dữ liệu mẫu" rồi xoá bằng tài khoản admin, hoặc xoá `prisma/dev.db` + `data/` rồi chạy lại `npm run setup`.

Tài khoản mặc định (mật khẩu `123456`, đổi ở menu tài khoản cuối sidebar):

| Tài khoản | Vai trò | Quyền |
|---|---|---|
| admin | Quản trị | Tất cả, kể cả xoá hợp đồng / file |
| nhanvien | Nhập liệu | Thêm, sửa, tải file, đổi trạng thái |
| xem | Chỉ xem | Xem, tải file |

## Chạy production (VPS)
```bash
npm run build
npm start -- -p 3100        # hoặc: pm2 start npm --name qlhd -- start -- -p 3100
```
Nếu chạy qua HTTP (không HTTPS) thì đặt `INSECURE_COOKIE=1` để cookie đăng nhập hoạt động.

## Chạy local với database dev riêng
Local **không** dùng database production. Có 2 database Neon:
- `qlhd-db` – production (biến `DATABASE_URL`)
- `qlhd-dev-db` – chỉ cho dev (biến `DEV_DATABASE_URL`, chỉ gắn môi trường Development)

```bash
npx vercel env pull .env.local        # lấy biến về máy
node scripts/dev-env.mjs              # tạo .env.development.local trỏ DB dev, file lưu ./data/uploads
npm run dev -- -p 3100
```
Khởi tạo DB dev (bảng + tài khoản mật khẩu `123456` + dữ liệu mẫu):
```bash
SEED_PASSWORD=123456 node --env-file=.env.development.local scripts/neon-setup.mjs
npx tsx --env-file=.env.development.local prisma/seed-samples.ts
```

## Deploy (Vercel + Neon + Vercel Blob)
- Production: https://qlhd-blond.vercel.app – mỗi lần push lên `main` Vercel tự build & deploy. Function chạy ở Singapore (`vercel.json` → `sin1`).
- Database production: Neon `qlhd-db-sg` (Singapore, biến `SG_DATABASE_URL`, ưu tiên hơn `DATABASE_URL` trong `src/lib/db.ts`). `qlhd-db` (Mỹ) là bản cũ, chỉ để dự phòng.
- Tìm kiếm không dấu cần extension `unaccent` (`CREATE EXTENSION IF NOT EXISTS unaccent`).
- Neon (Postgres) và Blob được gắn qua Vercel Marketplace → biến `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BLOB_READ_WRITE_TOKEN` tự có. `AUTH_SECRET` đặt tay trong Vercel.
- Lấy env về máy: `npx vercel env pull .env.local`
- Khởi tạo bảng + tài khoản trên Neon (chạy qua HTTPS, dùng được cả khi mạng chặn cổng 5432):
  `node --env-file=.env.local scripts/neon-setup.mjs`
- Đổi schema: sửa `prisma/schema.prisma`, sinh lại `prisma/sql/init.sql` (lệnh ở đầu `scripts/neon-setup.mjs`) hoặc chạy `npx prisma db push` nếu mạng mở cổng 5432.
- File lưu ở Vercel Blob, chỉ tải được qua `/api/files/[id]` sau khi đăng nhập. Đặt `BLOB_ACCESS=private` khi dùng store private (khuyến nghị).
- Giới hạn upload trên Vercel: ~4MB/file (giới hạn body của serverless function).

## Dữ liệu
- Database: `prisma/dev.db` (đổi bằng `DATABASE_URL` trong `.env`)
- File upload: `data/uploads/` (đổi bằng `UPLOAD_DIR`)
- Sao lưu = copy `prisma/dev.db` + thư mục `data/`.
- `.env` chứa `AUTH_SECRET` – không commit, mỗi máy tự tạo.

## Danh mục & trường riêng theo loại hợp đồng
Sửa trong `src/lib/constants.ts`:
- `COMPANY` – tên công ty (CÔNG TY TNHH TUTTYLAB)
- `CONTRACT_TYPES`, `DIRECTIONS`, `DOC_TYPES`, `EXPIRING_DAYS`
- `TYPE_FIELDS` – các ô thông tin riêng cho từng loại (thuê: diện tích, tiền cọc…; lao động: vị trí, lương…). Thêm/bớt trường ở đây, không cần đổi database (lưu trong cột `extra` dạng JSON).

## Cấu trúc
- `src/app/(app)/` – admin panel có sidebar: Tổng quan `/`, Hợp đồng `/contracts`, chi tiết `/contracts/[id]`, Tài liệu `/documents`, Đối tác `/partners`
- `src/app/api/` – API: auth, contracts, files
- `src/components/` – app-sidebar, dashboard, contract-list, contract-detail, contract-form, document-list, partner-list, file-drop
- `prisma/schema.prisma` – User, Contract, ContractFile, History

## Giai đoạn 2 (chưa làm)
Soạn hợp đồng / biên bản nghiệm thu từ template, đợt thanh toán, đánh số tự động, in A4.

## Đánh số hợp đồng
- Một dãy số **chung cho mọi loại hợp đồng** trong năm, bắt đầu lại từ 01 mỗi năm.
- Dạng: `09/2026/HĐDV/TUTTYLAB` = số thứ tự (2 chữ số) / năm / mã loại / công ty.
- Mã loại: HĐDV dịch vụ, HĐMB mua bán, HĐTH thuê, HĐLĐ lao động, HĐHT hợp tác, HĐNT nguyên tắc (sửa ở `TYPE_CODE` trong `src/lib/constants.ts`).
- Form "Thêm hợp đồng" tự điền số tiếp theo (`/api/contracts/next-no`), đọc được cả số cũ dạng `4/2026/HĐDV-TUTTYLAB`.
- Hợp đồng đã ký giữ nguyên số in trên bản ký.
