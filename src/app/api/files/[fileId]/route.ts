import { prisma } from "@/lib/db";
import { handle, requireUser } from "@/lib/auth";
import { readObject } from "@/lib/storage";

export const GET = (req: Request, { params }: { params: Promise<{ fileId: string }> }) => handle(async () => {
  await requireUser();
  const f = await prisma.contractFile.findUnique({ where: { id: (await params).fileId } });
  if (!f) return new Response("Not found", { status: 404 });
  const buf = await readObject(f.stored);
  const dl = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": f.mime, "Content-Length": String(buf.length),
      "Content-Disposition": `${dl ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    },
  });
});
