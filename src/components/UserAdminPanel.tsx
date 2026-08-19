'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PanelHeader from './PanelHeader';
import { fmtHOD, fmtDateTime, maskPhone, maskEmail } from '@/lib/fmt';

type UserDTO = {
  id: string;
  username: string;
  role: string;
  status: string;
  phone: string | null;
  email: string | null;
  platformId: string | null;
  boundAt: string | null;
  balance: number;
  betCount: number;
  wonTotal: number;
  createdAt: string;
};

export default function UserAdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 30;

  const fetchUsers = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(1, q); }, [q, fetchUsers]);

  function doSearch() {
    fetchUsers(1, q);
  }
  function goPage(p: number) {
    if (p < 1 || p > totalPages) return;
    fetchUsers(p, q);
  }

  async function act(u: UserDTO, action: 'ban' | 'unban') {
    const label = action === 'ban' ? '封禁' : '解封';
    if (!window.confirm(`确认${label}用户「${u.username}」？${action === 'ban' ? '封禁后该用户将无法登录与投注。' : ''}`)) return;
    const res = await fetch(`/api/admin/users/${u.id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    setMsg(res.ok ? { ok: true, text: `${label}成功` } : { ok: false, text: data?.error ?? '操作失败' });
    fetchUsers(page, q);
    router.refresh();
  }

  const pageBtns: number[] = [];
  const s = Math.max(1, page - 2);
  const e = Math.min(totalPages, page + 2);
  for (let i = s; i <= e; i++) pageBtns.push(i);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-7 py-5">
        <PanelHeader eyebrow="User List" title="用户列表" badge={`${total} 人`} />
        <div className="flex items-center gap-2 w-full max-w-xs">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="搜索用户名…"
            className="input"
          />
          <button onClick={doSearch} className="btn-secondary !px-3 !py-1.5 text-xs">搜索</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="tbl min-w-[900px] text-sm">
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>状态</th>
              <th>手机 / 邮箱</th>
              <th>平台绑定</th>
              <th>余额</th>
              <th>投注 / 中奖</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="py-10 text-center text-fg3">加载中…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9} className="py-10 text-center text-fg3">没有匹配的用户</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-fg">{u.username}</td>
                  <td>
                    {u.role === 'ADMIN' ? (
                      <span className="rounded-full bg-brandsoft px-2 py-0.5 text-xs text-brand">管理员</span>
                    ) : (
                      <span className="rounded-full bg-raise px-2 py-0.5 text-xs text-fg2">普通用户</span>
                    )}
                  </td>
                  <td>
                    {u.status === 'BANNED' ? (
                      <span className="rounded-full bg-errsoft px-2 py-0.5 text-xs text-err">已封禁</span>
                    ) : (
                      <span className="rounded-full bg-oksoft px-2 py-0.5 text-xs text-ok">正常</span>
                    )}
                  </td>
                  <td className="text-xs">
                    {u.phone || u.email ? (
                      <span className="mono-num text-fg2">
                        {u.phone ? maskPhone(u.phone) : '—'}
                        {' / '}
                        {u.email ? maskEmail(u.email) : '—'}
                      </span>
                    ) : (
                      <span className="text-fg3">未绑定</span>
                    )}
                  </td>
                  <td className="text-xs">
                    {u.platformId ? (
                      <span className="mono-num text-brand">{u.platformId}</span>
                    ) : (
                      <span className="text-fg3">未绑定</span>
                    )}
                  </td>
                  <td className="mono-num text-fg">{fmtHOD(u.balance)}</td>
                  <td className="mono-num text-fg2">
                    {u.betCount} 注 / <span className="text-ok">{fmtHOD(u.wonTotal)}</span>
                  </td>
                  <td className="text-xs text-fg3">{fmtDateTime(u.createdAt)}</td>
                  <td>
                    {u.role === 'ADMIN' ? (
                      <span className="text-xs text-fg3">—</span>
                    ) : u.status === 'BANNED' ? (
                      <button onClick={() => act(u, 'unban')} className="btn-secondary !px-3 !py-1 text-xs">解封</button>
                    ) : (
                      <button onClick={() => act(u, 'ban')} className="btn-danger !px-3 !py-1 text-xs">封禁</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 border-t border-line px-7 py-3">
          <button onClick={() => goPage(1)} disabled={page <= 1} className="btn-secondary !px-2 !py-1 text-xs">«</button>
          <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="btn-secondary !px-2 !py-1 text-xs">‹</button>
          {pageBtns.map((p) => (
            <button
              key={p}
              onClick={() => goPage(p)}
              className={p === page ? 'btn-primary !px-2.5 !py-1 text-xs' : 'btn-secondary !px-2.5 !py-1 text-xs'}
            >
              {p}
            </button>
          ))}
          <button onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="btn-secondary !px-2 !py-1 text-xs">›</button>
          <button onClick={() => goPage(totalPages)} disabled={page >= totalPages} className="btn-secondary !px-2 !py-1 text-xs">»</button>
          <span className="ml-3 text-xs text-fg3">第 {page}/{totalPages} 页</span>
        </div>
      )}

      {msg && <p className={`px-7 py-3 text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>}
    </div>
  );
}