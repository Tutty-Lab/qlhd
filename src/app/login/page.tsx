"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: f.get("username"), password: f.get("password"), remember }),
    });
    if (res.ok) window.location.href = "/";
    else { setErr((await res.json()).error || "Đăng nhập thất bại"); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="size-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-2"><FileText className="size-5" /></div>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Hệ thống quản lý hợp đồng</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="u">Tài khoản</Label><Input id="u" name="username" autoComplete="username" required /></div>
            <div className="space-y-1.5"><Label htmlFor="p">Mật khẩu</Label><Input id="p" name="password" type="password" autoComplete="current-password" required /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Ghi nhớ đăng nhập 30 ngày</label>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button className="w-full h-9" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Đăng nhập</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
