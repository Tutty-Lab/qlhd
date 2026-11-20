"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

// Ô tìm kiếm ở header dùng chung cho trang đang mở; các bảng đọc từ khoá qua useSearch()
const Ctx = createContext<{ q: string; setQ: (v: string) => void }>({ q: "", setQ: () => {} });
export const useSearch = () => useContext(Ctx);

const PAGES: { match: (p: string) => boolean; title: string; search?: string }[] = [
  { match: (p) => p === "/", title: "Tổng quan" },
  { match: (p) => p === "/contracts", title: "Hợp đồng", search: "Tìm số HĐ, đối tác, MST, nội dung, tag..." },
  { match: (p) => p.startsWith("/contracts/"), title: "Chi tiết hợp đồng" },
  { match: (p) => p === "/documents", title: "Tài liệu", search: "Tìm tên file, số hợp đồng, đối tác..." },
  { match: (p) => p === "/partners", title: "Đối tác", search: "Tìm tên đối tác, MST, người đại diện..." },
];

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [q, setQ] = useState("");
  useEffect(() => setQ(""), [path]); // đổi trang thì xoá từ khoá
  return <Ctx.Provider value={{ q, setQ }}>{children}</Ctx.Provider>;
}

export function PageHeader() {
  const path = usePathname();
  const page = PAGES.find((x) => x.match(path));
  const { q, setQ } = useSearch();
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4 md:px-6 sticky top-0 z-10 pl-14 md:pl-6">
      <h1 className="text-base font-semibold truncate">{page?.title ?? ""}</h1>
      {page?.search && (
        <div className="relative ml-auto w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 pr-8 h-9 bg-zinc-50" placeholder={page.search} aria-label="Tìm kiếm" />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700" aria-label="Xoá tìm kiếm">
              <X className="size-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
