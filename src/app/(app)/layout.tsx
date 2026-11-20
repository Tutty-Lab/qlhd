import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser, can } from "@/lib/auth";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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
          <SidebarTrigger className="md:hidden fixed top-3 left-3 z-20 bg-white border shadow-sm" />
          <div className="p-4 pt-14 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
