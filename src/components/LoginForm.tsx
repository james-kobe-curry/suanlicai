'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PasswordMeter from './PasswordMeter';
import { PASSWORD_HINT } from '@/lib/password';

type Tab = 'login' | 'register' | 'reset';
type LoginMethod = 'username' | 'phone' | 'email';

const LOGIN_METHODS = [
  { value: 'username', label: '用户名', placeholder: '请输入用户名' },
  { value: 'phone', label: '手机号', placeholder: '请输入已绑定的手机号' },
  { value: 'email', label: '邮箱', placeholder: '请输入已绑定的邮箱' },
] as const;

const PHONE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm({ phoneEnabled = false }: { phoneEnabled?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [method, setMethod] = useState<LoginMethod>('username');
  const [identifier, setIdentifier] = useState('');

  const METHODS = phoneEnabled ? LOGIN_METHODS : LOGIN_METHODS.filter(m => m.value !== 'phone');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [agreed, setAgreed] = useState(false);

  /** 切换页签时清空所有输入，避免账号/手机号/邮箱语义错位 */
  function switchTab(t: Tab) {
    if (t === tab) return;
    setTab(t);
    setIdentifier('');
    setPassword('');
    setConfirm('');
    setResetCode('');
    setResetSent(false);
    setAgreed(false);
    setErr('');
    if (t === 'login') setMethod('username');
  }

  function switchMethod(m: LoginMethod) {
    if (!phoneEnabled && m === 'phone') return;
    setMethod(m);
    setIdentifier('');
    setErr('');
  }

  function validateLoginIdentifier(v: string): string | null {
    if (method === 'phone' && !PHONE_RE.test(v)) return '请输入正确的 11 位手机号';
    if (method === 'email' && !EMAIL_RE.test(v)) return '请输入正确的邮箱地址';
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === 'register' && password !== confirm) {
      setErr('两次输入的密码不一致');
      return;
    }
    if (tab === 'login') {
      const idErr = validateLoginIdentifier(identifier);
      if (idErr) {
        setErr(idErr);
        return;
      }
    }
    if (tab === 'reset') {
      if (!resetSent) {
        setErr('请先获取验证码');
        return;
      }
      if (resetCode.length !== 6) {
        setErr('请输入 6 位验证码');
        return;
      }
    }
    setBusy(true);
    setErr('');
    try {
      const endpoint =
        tab === 'login'
          ? '/api/auth/login'
          : tab === 'register'
            ? '/api/auth/register'
            : '/api/auth/reset';
      const body =
        tab === 'reset'
          ? { identifier, code: resetCode, newPassword: password }
          : { username: identifier, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error ?? '操作失败，请重试');
        return;
      }
      if (tab === 'reset') {
        switchTab('login');
        setErr('密码已重置，请使用新密码登录');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setErr('网络请求失败，请检查网络后重试');
    } finally {
      setBusy(false);
    }
  }

  async function sendResetCode() {
    const isPhone = PHONE_RE.test(identifier);
    const isEmail = EMAIL_RE.test(identifier);
    if (!isPhone && !isEmail) {
      setErr('请输入已绑定的手机号或邮箱（邮箱需完整格式）');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/reset/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setResetSent(true);
        setResetCode('');
      } else {
        setErr(data?.error ?? '发送失败');
      }
    } catch {
      setErr('网络请求失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  const methodConf = LOGIN_METHODS.find((m) => m.value === method)!;

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-2xl font-semibold text-fg">
        {tab === 'login' ? '欢迎回来' : tab === 'register' ? '创建账户' : '找回密码'}
      </h1>
      <p className="mt-1.5 text-xs text-fg3">
        {tab === 'reset'
          ? '通过已绑定的手机号或邮箱验证重置密码'
          : '注册即赠 HOD 算力，可在「我的」页查看余额'}
      </p>

      <div className="segmented mt-6 w-full">
        {(['login', 'register'] as const).map((t) => (
          <button key={t} onClick={() => switchTab(t)} data-active={tab === t} className="flex-1">
            {t === 'login' ? '登录' : '注册'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {/* 登录方式选择 */}
        {tab === 'login' && (
          <div className="segmented w-full">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => switchMethod(m.value)}
                data-active={method === m.value}
                className="flex-1 !px-2"
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* 账号 / 手机号 / 邮箱输入 */}
        {tab === 'reset' ? (
          <div className="flex gap-2">
            <input
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value.trim());
                setResetSent(false);
              }}
              placeholder="已绑定的手机号 / 邮箱"
              className="input"
            />
            <button
              type="button"
              onClick={sendResetCode}
              disabled={busy || !identifier}
              className="btn-secondary shrink-0 !px-3 text-xs"
            >
              {resetSent ? '重新发送' : '获取验证码'}
            </button>
          </div>
        ) : (
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value.trim())}
            placeholder={tab === 'login' ? methodConf.placeholder : '用户名（2-20 位）'}
            className="input"
          />
        )}

        {/* 验证码核对区（找回密码） */}
        {tab === 'reset' && (
          <div className={`space-y-2 rounded-lg border border-line bg-raise p-3 ${resetSent ? '' : 'opacity-60'}`}>
            <p className="text-xs text-fg3">验证码核对</p>
            <input
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="请输入 6 位验证码"
              disabled={!resetSent}
              className="mono-num input"
            />
          </div>
        )}

        {/* 密码 */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            tab === 'login'
              ? '密码'
              : tab === 'register'
                ? '密码（8-64 位，至少 3 类字符）'
                : '新密码（8-64 位，至少 3 类字符）'
          }
          className="input"
        />
        {tab !== 'login' && (
          <div className="space-y-1.5">
            <PasswordMeter value={password} />
            <p className="text-xs text-fg3">{PASSWORD_HINT}</p>
          </div>
        )}
        {tab === 'register' && (
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="确认密码"
            className="input"
          />
        )}
        {err && <p className="text-xs text-err">{err}</p>}
        {/* 用户协议 */}
        {(tab === 'login' || tab === 'register') && (
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 shrink-0 accent-brand"
            />
            <span className="text-xs text-fg3 leading-relaxed">
              我已阅读并同意{' '}
              <Link href="/agreement" target="_blank" className="text-brand hover:underline">
                《HOD 算力彩用户服务协议》
              </Link>
            </span>
          </label>
        )}
        <button
          type="submit"
          disabled={
            busy ||
            (tab === 'reset' && (!resetSent || resetCode.length !== 6)) ||
            ((tab === 'login' || tab === 'register') && !agreed)
          }
          className="btn-primary w-full !py-2.5"
        >
          {busy
            ? '提交中…'
            : tab === 'login'
              ? '登录'
              : tab === 'register'
                ? '注册'
                : '重置密码'}
        </button>
      </form>

      {tab === 'login' && (
        <p className="mt-4 text-center text-xs">
          <button
            onClick={() => switchTab('reset')}
            className="text-fg3 transition-colors duration-150 hover:text-brand"
          >
            忘记密码？
          </button>
        </p>
      )}
      {tab === 'reset' && (
        <p className="mt-4 text-center text-xs">
          <button
            onClick={() => switchTab('login')}
            className="text-fg3 transition-colors duration-150 hover:text-brand"
          >
            返回登录
          </button>
        </p>
      )}
    </div>
  );
}
