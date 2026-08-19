'use client';

import { passwordStrength } from '@/lib/password';

/** 密码强度指示条（3 段） */
export default function PasswordMeter({ value }: { value: string }) {
  const { score, label } = passwordStrength(value);
  if (!value) return null;
  const barColor = score <= 1 ? 'bg-err' : score === 2 ? 'bg-warn' : 'bg-ok';
  const textColor = score <= 1 ? 'text-err' : score === 2 ? 'text-warn' : 'text-ok';

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              score >= i ? barColor : 'bg-line'
            }`}
          />
        ))}
      </div>
      <span className={`w-6 text-right text-xs ${textColor}`}>{label}</span>
    </div>
  );
}
