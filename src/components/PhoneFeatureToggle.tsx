'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PhoneFeatureToggle() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/phone')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setEnabled(d.phoneAuthEnabled); })
      .catch(() => {});
  }, []);

  async function toggle() {
    setBusy(true);
    const res = await fetch('/api/admin/settings/phone', { method: 'POST' });
    const data = await res.json().catch(() => null);
    if (data) setEnabled(data.phoneAuthEnabled);
    setBusy(false);
    router.refresh();
  }

  if (enabled === null) return null;

  return (
    <div className="card card-hover p-5">
      <p className="eyebrow">功能开关</p>
      <div className="mt-2.5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-fg">手机号绑定 / 登录</p>
          <p className="text-xs text-fg3">
            {enabled ? '已开启：用户可通过手机号绑定与登录' : '已关闭：手机号相关功能暂不可用'}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? '关闭手机号功能' : '开启手机号功能'}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
            enabled ? 'bg-brand' : 'bg-line'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}