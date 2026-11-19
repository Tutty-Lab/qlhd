"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const TITLES: Record<string, string> = { contracts: "Hợp đồng", documents: "Tài liệu", partners: "Đối tác" };

export function PageHeader() {
  const parts = usePathname().split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = parts.length === 0 ? [{ label: "Tổng quan" }]
    : parts.map((p, i) => ({ label: TITLES[p] ?? "Chi tiết", href: i < parts.length - 1 ? "/" + parts.slice(0, i + 1).join("/") : undefined }));
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <span key={i} className="contents">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {c.href ? <BreadcrumbLink asChild><Link href={c.href}>{c.label}</Link></BreadcrumbLink> : <BreadcrumbPage>{c.label}</BreadcrumbPage>}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
