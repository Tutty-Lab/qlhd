import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Quản lý hợp đồng",
  description: "Lưu trữ và quản lý hợp đồng, phụ lục, biên bản nghiệm thu",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased bg-zinc-50`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
