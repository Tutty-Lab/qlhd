// Lưu file: Vercel Blob khi có BLOB_READ_WRITE_TOKEN, ngược lại lưu ổ đĩa local (dev).
// BLOB_ACCESS = "private" (khuyến nghị, cần store private) hoặc "public" (mặc định).
// Cột `stored` = "blob:<pathname>" hoặc tên file trong UPLOAD_DIR.
// URL blob không bao giờ gửi ra trình duyệt: file chỉ tải qua /api/files/[id] (có kiểm tra đăng nhập).
import fs from "fs/promises";
import path from "path";
import { put, del, get } from "@vercel/blob";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
const BLOB = "blob:";
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const access = () => (process.env.BLOB_ACCESS === "private" ? "private" : "public");

export async function saveObject(name: string, data: Buffer | Uint8Array, mime: string): Promise<string> {
  if (blobEnabled()) {
    const blob = await put(`contracts/${name}`, Buffer.from(data), { access: access(), contentType: mime, addRandomSuffix: true });
    return BLOB + blob.pathname;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), data);
  return name;
}

export async function readObject(stored: string): Promise<Buffer> {
  if (stored.startsWith(BLOB)) {
    const r = await get(stored.slice(BLOB.length), { access: access(), useCache: false });
    if (!r || r.statusCode !== 200) throw new Error("Không đọc được file");
    return Buffer.from(await new Response(r.stream).arrayBuffer());
  }
  return fs.readFile(path.join(UPLOAD_DIR, path.basename(stored)));
}

export async function deleteObject(stored: string) {
  try {
    if (stored.startsWith(BLOB)) await del(stored.slice(BLOB.length));
    else await fs.rm(path.join(UPLOAD_DIR, path.basename(stored)), { force: true });
  } catch (e) { console.error("deleteObject", e); }
}
