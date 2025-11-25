import type { Metadata } from "next";
import { Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-noto-serif',
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || '古籍典藏',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '个人古籍数字图书馆',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={notoSerifSC.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
