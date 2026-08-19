import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Nav from "@/components/Nav";
import BindReminder from "@/components/BindReminder";

export const metadata: Metadata = {
  title: "HOD 算力彩 · 算力竞猜平台",
  description: "用平台算力参与 6 位数字竞猜，每期开奖、80% 返奖、哈希承诺公平可验证",
};

// 首屏渲染前同步主题，避免闪烁（默认暗色）
const themeScript = `(function(){try{var t=localStorage.getItem('hod-theme');if(t==='light'){document.documentElement.classList.remove('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
        <BindReminder />
        <footer className="mt-4 border-t border-line py-8">
          <div className="hairline mx-auto mb-6 max-w-5xl" />
          <p className="text-xs text-fg3">
            <span className="font-semibold text-fg2">HOD 算力彩</span> · 算力竞猜平台 ·
            禁止未成年人参与 · 理性投入
          </p>
          <p className="mono-num mt-1.5 text-[11px] tracking-[0.18em] text-fg3/80">
            SHA-256 VERIFIED · 奖池与派奖数据实时可查
          </p>
          <p className="mt-2 text-xs text-fg3/60">
            <Link href="/agreement" className="hover:text-fg transition-colors">用户服务协议</Link>
            {' · '}
            <Link href="/rules" className="hover:text-fg transition-colors">玩法规则</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
