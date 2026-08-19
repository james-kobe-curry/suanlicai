'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { maskPhone, maskEmail } from '@/lib/fmt';

type CType = 'PHONE' | 'EMAIL';

function Row({ type, value, label }: { type: CType; value: string | null; label: string }) {
  const router = useRouter();
  const isPhone = type === 'PHONE';
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'idle' | 'sent'>('idle');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [unbinding, setUnbinding] = useState(false);
  const [unbindPw, setUnbindPw] = useState('');

  async function sendCode() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/me/contact/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: input }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setStep('sent');
        setMsg({ ok: true, text: data.sentReal ? '验证码已发送至邮箱（5 分钟内有效）' : '验证码已发送（5 分钟内有效）' });
      } else {
        setMsg({ ok: false, text: data?.error ?? '发送失败' });
      }
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请重试' });
    } finally {
      setBusy(false);
    }
  }

  async function bind() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/me/contact/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: input, code }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setMsg({ ok: true, text: '绑定成功' });
        setInput('');
        setCode('');
        setStep('idle');
        router.refresh();
      } else {
        setMsg({ ok: false, text: data?.error ?? '绑定失败' });
      }
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请重试' });
    } finally {
      setBusy(false);
    }
  }

  async function unbind() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/me/contact/unbind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, password: unbindPw }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setMsg({ ok: true, text: '已解绑' });
        setUnbinding(false);
        setUnbindPw('');
        router.refresh();
      } else {
        setMsg({ ok: false, text: data?.error ?? '解绑失败' });
      }
    } catch {
      setMsg({ ok: false, text: '网络请求失败，请重试' });
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className="rounded-xl border border-line bg-raise px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-fg3">{label}</p>
            <p className="mono-num mt-0.5 font-medium text-fg">
              {isPhone ? maskPhone(value) : maskEmail(value)}
            </p>
          </div>
          {unbinding ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="password"
                placeholder="输入密码确认"
                value={unbindPw}
                onChange={(e) => setUnbindPw(e.target.value)}
                className="input !w-44"
              />
              <button onClick={unbind} disabled={busy || !unbindPw} className="btn-danger !px-3 !py-1.5 text-xs">
                确认解绑
              </button>
              <button
                onClick={() => {
                  setUnbinding(false);
                  setUnbindPw('');
                }}
                className="btn-secondary !px-3 !py-1.5 text-xs"
              >
                取消
              </button>
            </div>
          ) : (
            <button onClick={() => setUnbinding(true)} className="btn-secondary !px-3 !py-1.5 text-xs">
              解绑
            </button>
          )}
        </div>
        {msg && <p className={`mt-2 text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-raise px-4 py-3">
      <p className="text-xs text-fg3">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value.trim());
            setStep('idle');
            setCode('');
          }}
          placeholder={isPhone ? '11 位手机号' : 'name@example.com'}
          className="input !max-w-60"
        />
        {step === 'idle' ? (
          <button onClick={sendCode} disabled={busy || !input} className="btn-secondary !px-3 !py-2 text-xs">
            获取验证码
          </button>
        ) : (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 位验证码"
              className="mono-num input !max-w-32"
            />
            <button onClick={bind} disabled={busy || code.length !== 6} className="btn-primary !px-3 !py-2 text-xs">
              确认绑定
            </button>
            <button
              onClick={() => {
                setStep('idle');
                setCode('');
              }}
              className="btn-secondary !px-3 !py-2 text-xs"
            >
              返回
            </button>
          </>
        )}
      </div>
      {msg && <p className={`mt-2 text-xs ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>}
    </div>
  );
}

/** 手机号 / 邮箱绑定（验证码校验绑定，密码确认解绑） */
export default function ContactBindCard({
  phone,
  email,
  phoneEnabled = true,
}: {
  phone: string | null;
  email: string | null;
  phoneEnabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {phoneEnabled && <Row type="PHONE" value={phone} label="手机号" />}
      <Row type="EMAIL" value={email} label="邮箱" />
    </div>
  );
}
