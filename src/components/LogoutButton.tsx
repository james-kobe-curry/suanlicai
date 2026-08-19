'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="rounded-lg px-2.5 py-1 text-xs text-fg3 transition-colors duration-150 hover:bg-raise hover:text-fg"
    >
      退出
    </button>
  );
}
