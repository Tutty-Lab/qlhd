// Lưu file: Vercel Blob khi có BLOB_READ_WRITE_TOKEN (production), ngược lại lưu ổ đĩa local (dev).
// Cột `stored` = URL blob (https://...) hoặc tên file trong UPLOAD_DIR.
// Người dùng không bao giờ thấy URL blob: file luôn được tải qua /api/files/[id] (có kiểm tra đăng nhập).
import fs from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const isUrl = (s: string) => /^https?:\/\//.test(s);

export async function saveObject(name: string, data: Buffer | Uint8Array, mime: string): Promise<string> {
  if (blobEnabled()) {
    const blob = await put(`contracts/${name}`, Buffer.from(data), { access: "public", contentType: mime, addRandomSuffix: true });
    return blob.url;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), data);
  return name;
}

export async function readObject(stored: string): Promise<Buffer> {
  if (isUrl(stored)) {
    const res = await fetch(stored, { cache: "no-store" });
    if (!res.ok) throw new Error("Không đọc được file");
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFile(path.join(UPLOAD_DIR, path.basename(stored)));
}

export async function deleteObject(stored: string) {
  try {
    if (isUrl(stored)) await del(stored);
    else await fs.rm(path.join(UPLOAD_DIR, path.basename(stored)), { force: true });
  } catch (e) { console.error("deleteObject", e); }
}
