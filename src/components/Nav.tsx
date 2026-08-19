import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { fmtHOD } from '@/lib/fmt';
import LogoutButton from './LogoutButton';
import ThemeToggle from './ThemeToggle';

const linkCls = 'rounded-lg px-2 py-1 text-sm text-fg2 transition-colors duration-150 hover:text-fg';

export default async function Nav() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/85 shadow-[0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-lg">
      <div className="mx-auto flex h-auto min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2 max-w-5xl sm:flex-nowrap sm:py-0">
        <div className="flex items-center gap-3 sm:gap-7">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-branda to-brand text-sm font-bold text-brandfg shadow-sm">
              H
            </span>
            <span className="text-base font-semibold tracking-wide text-fg">
              HOD <span className="font-normal text-fg2">算力乐</span>
            </span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link href="/" className={linkCls}>投注</Link>
            <Link href="/rounds" className={linkCls}>开奖公示</Link>
            <Link href="/leaderboard" className={linkCls}>排行榜</Link>
            <Link href="/me" className={`${linkCls} hidden xs:inline`}>我的</Link>
            <Link href="/rules" className={`${linkCls} hidden sm:inline`}>玩法规则</Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className={`${linkCls} font-medium text-brand`}>
                管理
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <ThemeToggle />
          {user ? (
            <>
              {user.platformId && (
                <span className="hidden items-center gap-1.5 rounded-full bg-brandsoft px-2.5 py-1 text-xs text-brand sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  已绑定平台
                </span>
              )}
              <span className="rounded-full border border-line bg-raise px-3 py-1 text-fg2">
                余额{' '}
                <span className="mono-num font-semibold text-fg">{fmtHOD(user.balance)}</span>{' '}
                HOD
              </span>
              <span className="hidden text-fg3 sm:inline">{user.username}</span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="btn-primary !px-4 !py-1.5">
              登录 / 注册
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
