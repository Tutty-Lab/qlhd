"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { COMPANY, DOC_TYPES, ROLE_LABEL } from "@/lib/constants";
import { api, jsonInit } from "@/lib/format";
import { Building2, ChevronsUpDown, ClipboardCheck, FileStack, FileText, KeyRound, LayoutDashboard, LogOut, Plus, Users } from "lucide-react";

const NAV = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/contracts", label: "Hợp đồng", icon: FileText },
  { href: "/documents", label: "Tài liệu", icon: FileStack },
  { href: "/partners", label: "Đối tác", icon: Users },
];

export function AppSidebar({ name, role, canEdit }: { name: string; role: string; canEdit: boolean }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }
  async function changePw() {
    try {
      await api("/api/auth/password", jsonInit("POST", { oldPassword, newPassword }));
      toast.success("Đã đổi mật khẩu"); setPwOpen(false); setOld(""); setNew("");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg"><Building2 className="size-4" /></div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">TUTTYLAB</span>
                  <span className="truncate text-xs text-muted-foreground">Quản lý hợp đồng</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton asChild isActive={active(n.href)} tooltip={n.label}>
                    <Link href={n.href}><n.icon /><span>{n.label}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Lối tắt</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {canEdit && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Thêm hợp đồng"><Link href="/contracts?new=1"><Plus /><span>Thêm hợp đồng</span></Link></SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={DOC_TYPES[2]}>
                  <Link href={`/documents?type=${encodeURIComponent(DOC_TYPES[2])}`}><ClipboardCheck /><span>Biên bản nghiệm thu</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg">{name.trim().charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="min-w-56">
                <DropdownMenuLabel className="font-normal"><div className="font-medium">{name}</div><div className="text-xs text-muted-foreground">{COMPANY.name}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setPwOpen(true)}><KeyRound /> Đổi mật khẩu</DropdownMenuItem>
                <DropdownMenuItem onSelect={logout}><LogOut /> Đăng xuất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Đổi mật khẩu</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Mật khẩu cũ</Label><Input type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Mật khẩu mới (≥ 6 ký tự)</Label><Input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={changePw}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
