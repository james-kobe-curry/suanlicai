'use client';

import { useState } from 'react';

/** 开奖公平性校验：sha256(竞猜码|盐) 与期次创建时公示的承诺哈希比对 */
export default function VerifyBox({
  hash,
  salt,
  code,
}: {
  hash: string;
  salt: string | null;
  code: string | null;
}) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ ok: boolean; digest: string } | null>(null);

  async function verify() {
    if (!salt || !/^\d{6}$/.test(input)) return;
    const data = new TextEncoder().encode(`${input}|${salt}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    const digest = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setResult({ ok: digest === hash, digest });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={code ?? '输入 6 位竞猜码'}
          className="mono-num flex-1 rounded-lg border border-line bg-raise px-3 py-2.5 text-lg tracking-[0.2em] text-brand outline-none transition-all duration-150 focus:border-brand focus:shadow-[0_0_0_3px_var(--t-brand-soft)]"
        />
        <button onClick={verify} disabled={!salt} className="btn-primary shrink-0">
          验证
        </button>
      </div>
      {result && (
        <div
          className={`break-all rounded-lg border p-3 text-xs ${
            result.ok
              ? 'border-ok/30 bg-oksoft text-ok'
              : 'border-err/30 bg-errsoft text-err'
          }`}
        >
          <p className="font-medium">
            {result.ok ? '校验通过：与期次创建时公示的承诺哈希一致' : '校验失败：与承诺哈希不一致'}
          </p>
          <p className="mt-1 font-mono">
            sha256({input}|{salt}) = {result.digest}
          </p>
        </div>
      )}
    </div>
  );
}
