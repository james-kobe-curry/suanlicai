'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  {
    href: '/admin',
    label: '期次管理',
    en: 'Rounds',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: '/admin/dashboard',
    label: '运营看板',
    en: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="13" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="3" y="16" width="7" height="4" rx="1" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: '用户管理',
    en: 'Users',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/redeem',
    label: '兑换码管理',
    en: 'Redeem',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v10H4V12" />
        <path d="M2 7h20v5H2zM12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
];

export default function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 ${
      active
        ? 'border border-brand/30 bg-brandsoft text-brand'
        : 'border border-transparent text-fg2 hover:bg-raise hover:text-fg'
    }`;

  return (
    <div>
      {/* 移动端：横向页签 */}
      <div className="segmented mb-5 w-full lg:hidden">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            data-active={String(isActive(it.href))}
            className="flex-1 !px-2"
          >
            {it.label}
          </Link>
        ))}
      </div>

      {/* 桌面端：左侧边栏 */}
      <div className="hidden lg:block">
        <div className="mb-4 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-[var(--t-shadow)]">
          <p className="eyebrow text-brand">Admin Console</p>
          <p className="mt-0.5 text-sm font-semibold text-fg">管理控制台</p>
        </div>
        <nav className="space-y-1.5">
          {ITEMS.map((it) => (
            <Link key={it.href} href={it.href} className={linkCls(isActive(it.href))}>
              {it.icon}
              <span className="flex-1">
                <span className="block text-sm font-medium">{it.label}</span>
                <span className="block text-[10px] uppercase tracking-[0.14em] opacity-60">
                  {it.en}
                </span>
              </span>
              {isActive(it.href) && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-line pt-4">
          <Link href="/" className="text-xs text-fg3 transition-colors duration-150 hover:text-fg">
            ← 返回前台
          </Link>
        </div>
      </div>
    </div>
  );
}
