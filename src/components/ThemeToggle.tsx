'use client';

import { useEffect, useState } from 'react';

const KEY = 'hod-theme';

/** 暗色/浅色主题切换（默认暗色，选择持久化） */
export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    let isDark = true;
    try {
      const saved = localStorage.getItem(KEY);
      isDark = saved ? saved === 'dark' : true;
    } catch {
      /* ignore */
    }
    // 同步外部系统（DOM 主题类）
    document.documentElement.classList.toggle('dark', isDark);
    // 通过微任务回调回写组件状态（订阅式回调，避免 effect 内同步 setState）
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setDark(isDark);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? '切换到浅色主题' : '切换到暗色主题'}
      title={dark ? '切换到浅色主题' : '切换到暗色主题'}
      className="btn-secondary !rounded-full !p-2"
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
