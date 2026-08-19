'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const DISMISS_KEY = 'hod-bind-dismissed';

/**
 * 未绑定手机/邮箱的登录用户，登录后弹窗提示完成安全绑定。
 * 仅可浏览，无法参与投注；在「我的」页不打扰，稍后再说按会话记住。
 */
export default function BindReminder() {
  const pathname = usePathname();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
        if (pathname.startsWith('/me') || pathname.startsWith('/login')) return;
        const res = await fetch('/api/me');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.user && !data.user.bound) setShow(true);
      } catch {
        /* ignore */
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!show) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card fade-up w-full max-w-md p-8">
        <p className="eyebrow text-brand">Security Notice</p>
        <h2 className="mt-2 text-xl font-semibold text-fg">请先绑定手机号或邮箱</h2>
        <p className="mt-3 text-sm leading-relaxed text-fg2">
          为保障账户与算力资产安全，参与投注、绑定平台账户、领取算力等操作需先完成手机号或邮箱验证绑定。
          未绑定期间您仅可浏览平台内容，无法实际参与。
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="btn-primary flex-1"
            onClick={() => {
              setShow(false);
              router.push('/me');
            }}
          >
            去绑定
          </button>
          <button className="btn-secondary" onClick={dismiss}>
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}
