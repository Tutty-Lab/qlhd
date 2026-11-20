import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser, can } from "@/lib/auth";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageHeader, SearchProvider } from "@/components/page-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getUser();
  if (!me) redirect("/login");
  const open = (await cookies()).get("sidebar_state")?.value !== "false";
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={open}>
        <AppSidebar name={me.name} role={me.role} canEdit={can.edit(me)} />
        <SidebarInset className="bg-zinc-50 min-w-0">
          {/* Mobile: sidebar ẩn hẳn nên cần nút mở; desktop dùng nút trong sidebar */}
          <SidebarTrigger className="md:hidden fixed top-3.5 left-3 z-20" />
          <SearchProvider>
            <PageHeader />
            <div className="p-4 md:p-6">{children}</div>
          </SearchProvider>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
