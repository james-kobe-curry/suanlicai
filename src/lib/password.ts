/**
 * 密码强度策略（客户端 UI 与服务端校验共用）：
 * - 长度 8-64 位
 * - 至少包含 大写字母 / 小写字母 / 数字 / 特殊符号 中的 3 类
 * - 不能包含用户名
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

export const PASSWORD_HINT =
  '密码需 8-64 位，且至少包含大写字母、小写字母、数字、特殊符号中的 3 类';

const SYMBOL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;

function classCount(pw: string): number {
  return [
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /\d/.test(pw),
    SYMBOL_RE.test(pw),
  ].filter(Boolean).length;
}

/** 返回不满足原因；满足返回 null */
export function validatePassword(pw: string, username?: string): string | null {
  if (pw.length < PASSWORD_MIN || pw.length > PASSWORD_MAX) {
    return `密码长度需为 ${PASSWORD_MIN}-${PASSWORD_MAX} 位`;
  }
  if (classCount(pw) < 3) {
    return '密码强度不足：需包含大写字母、小写字母、数字、特殊符号中的至少 3 类';
  }
  if (username && pw.toLowerCase().includes(username.toLowerCase())) {
    return '密码不能包含用户名';
  }
  return null;
}

/** UI 强度指示：0-3 分 → 弱 / 中 / 强 */
export function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= PASSWORD_MIN) score++;
  const classes = classCount(pw);
  if (classes >= 3) score++;
  if (pw.length >= 12 && classes >= 4) score++;
  const label = score <= 1 ? '弱' : score === 2 ? '中' : '强';
  return { score, label };
}
